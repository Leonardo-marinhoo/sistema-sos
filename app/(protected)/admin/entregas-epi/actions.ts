"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/session";
import { withLogging } from "@/lib/logger/server-action-logger";

const createDeliverySchema = z.object({
  employee_user_id: z.string().uuid(),
  receiver_signature_data_url: z.string().min(1, "Assinatura do colaborador e obrigatoria"),
  deliverer_signature_data_url: z.string().min(1, "Assinatura do Responsável e obrigatoria"),
});

const SIGNATURE_DATA_URL_REGEX = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/;

function parsePositiveInt(value: string, fieldName: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} deve ser um numero maior que zero`);
  }
  return parsed;
}

function validateDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Data de validade invalida em um dos itens");
  }
  return value;
}

function validateSignatureDataUrl(value: string, fieldName: string) {
  if (!SIGNATURE_DATA_URL_REGEX.test(value)) {
    throw new Error(`${fieldName} invalida. Refaca a assinatura no campo indicado`);
  }

  if (value.length > 1_500_000) {
    throw new Error(`${fieldName} excede o limite permitido`);
  }
}

export async function createEpiDelivery(formData: FormData) {
  return withLogging(async () => {
    const { supabase, profile } = await requirePermission("epi-deliver");

    const payload = createDeliverySchema.safeParse({
      employee_user_id: formData.get("employee_user_id"),
      receiver_signature_data_url: formData.get("receiver_signature_data_url")?.toString().trim() ?? "",
      deliverer_signature_data_url: formData.get("deliverer_signature_data_url")?.toString().trim() ?? "",
    });

    if (!payload.success) {
      throw new Error(payload.error.issues[0]?.message ?? "Dados invalidos para entrega");
    }

    validateSignatureDataUrl(payload.data.receiver_signature_data_url, "Assinatura do colaborador");
    validateSignatureDataUrl(payload.data.deliverer_signature_data_url, "Assinatura do entregador");

    const epiIds = formData.getAll("epi_ids").map((value) => String(value).trim());
    const quantities = formData.getAll("quantities").map((value) => String(value).trim());
    const expiresAts = formData.getAll("expires_ats").map((value) => String(value).trim());

    const maxItems = Math.max(epiIds.length, quantities.length, expiresAts.length);
    const items: Array<{ epi_id: string; quantity: number; expires_at: string }> = [];

    for (let index = 0; index < maxItems; index += 1) {
      const epiId = epiIds[index] ?? "";
      const quantityRaw = quantities[index] ?? "";
      const expiresAtRaw = expiresAts[index] ?? "";

      if (!epiId && !quantityRaw && !expiresAtRaw) {
        continue;
      }

      if (!epiId || !quantityRaw || !expiresAtRaw) {
        throw new Error("Cada item de entrega deve ter EPI, quantidade e validade");
      }

      items.push({
        epi_id: epiId,
        quantity: parsePositiveInt(quantityRaw, "Quantidade"),
        expires_at: validateDate(expiresAtRaw),
      });
    }

    if (items.length === 0) {
      throw new Error("Adicione ao menos um item de EPI na entrega");
    }

    const uniqueEpiIds = Array.from(new Set(items.map((item) => item.epi_id)));
    if (uniqueEpiIds.length !== items.length) {
      throw new Error("Nao repita o mesmo EPI mais de uma vez na mesma entrega");
    }

    const { data: employee, error: employeeError } = await supabase
      .from("app_users")
      .select("id,company_id,is_active,role")
      .eq("id", payload.data.employee_user_id)
      .maybeSingle();

    if (employeeError || !employee) {
      throw new Error("Colaborador nao encontrado");
    }

    if (!employee.is_active || employee.role !== "employee") {
      throw new Error("Entrega so pode ser registrada para colaborador ativo");
    }

    if (!profile.is_superadmin && employee.company_id !== profile.company_id) {
      throw new Error("Sem permissao para registrar entrega fora da sua empresa");
    }

    const { data: episData, error: episError } = await supabase
      .from("epis")
      .select("id,company_id")
      .in("id", uniqueEpiIds);

    if (episError) {
      throw new Error(episError.message);
    }

    if ((episData ?? []).length !== uniqueEpiIds.length) {
      throw new Error("Um ou mais EPIs selecionados nao existem");
    }

    const hasForeignCompanyEpi = (episData ?? []).some((epi) => epi.company_id !== employee.company_id);
    if (hasForeignCompanyEpi) {
      throw new Error("Todos os EPIs da entrega devem pertencer a empresa do colaborador");
    }

    const { data: delivery, error: insertDeliveryError } = await supabase
      .from("epi_deliveries")
      .insert({
        company_id: employee.company_id,
        employee_user_id: employee.id,
        delivered_by_user_id: profile.id,
        receiver_signature_data_url: payload.data.receiver_signature_data_url,
        deliverer_signature_data_url: payload.data.deliverer_signature_data_url,
        created_by_user_id: profile.id,
      })
      .select("id")
      .single();

    if (insertDeliveryError || !delivery) {
      throw new Error(insertDeliveryError?.message ?? "Falha ao criar entrega");
    }

    const { error: insertItemsError } = await supabase.from("epi_delivery_items").insert(
      items.map((item) => ({
        delivery_id: delivery.id,
        epi_id: item.epi_id,
        quantity: item.quantity,
        expires_at: item.expires_at,
      }))
    );

    if (insertItemsError) {
      await supabase.from("epi_deliveries").delete().eq("id", delivery.id);
      throw new Error(insertItemsError.message);
    }

    revalidatePath("/admin/entregas-epi");
    revalidatePath(`/admin/entregas-epi/${delivery.id}`);
  }, { action: "create", entityType: "epi_delivery", description: "Criação de entrega de EPI" });
}
