"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission, requireSession } from "@/lib/auth/session";
import { withLogging } from "@/lib/logger/server-action-logger";

type PermitStatus = "draft" | "active" | "expired" | "cancelled";

const createSchema = z.object({
  company_id: z.string().uuid(),
  activity_id: z.string().uuid(),
  requested_by_user_id: z.string().uuid(),
  starts_at: z.string().min(1),
  expires_at: z.string().min(1),
  checklist_raw: z.string().min(1, "Checklist deve conter ao menos 1 item"),
});

function parseChecklist(raw: string) {
  return Array.from(
    new Set(
      raw
        .split("\n")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    )
  );
}

function normalizeDateOrThrow(raw: string, fieldName: string) {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Data invalida para ${fieldName}`);
  }
  return date;
}

async function assertPermitScope(
  supabase: Awaited<ReturnType<typeof requireSession>>["supabase"],
  permitId: string,
  companyId: string | null,
  isSuperadmin: boolean,
  allowedStatuses?: PermitStatus[]
) {
  const { data: permit, error } = await supabase
    .from("work_permits")
    .select("id,company_id,status,expires_at")
    .eq("id", permitId)
    .single();

  if (error || !permit) {
    throw new Error("Permissao de trabalho nao encontrada");
  }

  if (!isSuperadmin && permit.company_id !== companyId) {
    throw new Error("Sem permissao para operar essa permissao de trabalho");
  }

  if (allowedStatuses && !allowedStatuses.includes(permit.status as PermitStatus)) {
    throw new Error("Status da permissao de trabalho nao permite essa acao");
  }

  return permit;
}

const SIGNATURE_DATA_URL_REGEX = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/;

function validateSignatureDataUrl(value: string, fieldName: string) {
  if (!SIGNATURE_DATA_URL_REGEX.test(value)) {
    throw new Error(`${fieldName} invalida. Refaca a assinatura no campo indicado`);
  }

  if (value.length > 1_500_000) {
    throw new Error(`${fieldName} excede o limite permitido`);
  }
}

export async function createWorkPermit(formData: FormData) {
  return withLogging(async () => {
    const { supabase, profile } = await requirePermission("pt-create");

    const payload = createSchema.safeParse({
      company_id: formData.get("company_id"),
      activity_id: formData.get("activity_id"),
      requested_by_user_id: formData.get("requested_by_user_id"),
      starts_at: formData.get("starts_at"),
      expires_at: formData.get("expires_at"),
      checklist_raw: formData.get("checklist_raw"),
    });

    if (!payload.success) {
      throw new Error(payload.error.issues[0]?.message ?? "Dados invalidos para PT");
    }

    if (!profile.is_superadmin && payload.data.company_id !== profile.company_id) {
      throw new Error("Sem permissao para criar PT fora da sua empresa");
    }

    const startsAt = normalizeDateOrThrow(payload.data.starts_at, "inicio");
    const expiresAt = normalizeDateOrThrow(payload.data.expires_at, "fim");

    if (expiresAt <= startsAt) {
      throw new Error("Data de fim deve ser maior que a data de inicio");
    }

    const checklistItems = parseChecklist(payload.data.checklist_raw);
    if (checklistItems.length === 0) {
      throw new Error("Checklist deve conter ao menos 1 item");
    }

    const { data: requester, error: requesterError } = await supabase
      .from("app_users")
      .select("id,company_id,is_active")
      .eq("id", payload.data.requested_by_user_id)
      .single();

    if (requesterError || !requester || !requester.is_active) {
      throw new Error("Colaborador solicitante invalido");
    }

    if (requester.company_id !== payload.data.company_id) {
      throw new Error("Colaborador deve pertencer a mesma empresa da PT");
    }

    const { data: permit, error: permitError } = await supabase
      .from("work_permits")
      .insert({
        company_id: payload.data.company_id,
        activity_id: payload.data.activity_id,
        requested_by_user_id: payload.data.requested_by_user_id,
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: "draft",
        created_by_user_id: profile.id,
      })
      .select("id")
      .single();

    if (permitError || !permit) {
      throw new Error(permitError?.message ?? "Falha ao criar PT");
    }

    const { error: checklistError } = await supabase.from("work_permit_checklist_items").insert(
      checklistItems.map((itemText) => ({
        permit_id: permit.id,
        item_text: itemText,
        is_checked: false,
      }))
    );

    if (checklistError) {
      throw new Error(checklistError.message);
    }

    revalidatePath("/admin/permissoes-trabalho");
  }, { action: "create", entityType: "work_permit", description: "Criação de permissão de trabalho" });
}

export async function updatePermitChecklist(formData: FormData) {
  return withLogging(async () => {
    const { supabase, profile } = await requirePermission("pt-create");
    const permitId = z.string().uuid().parse(formData.get("permit_id"));
    const checkedIds = formData
      .getAll("checked_item_ids")
      .map((v) => String(v))
      .filter((v) => /^[0-9a-fA-F-]{36}$/.test(v));

    await assertPermitScope(
      supabase,
      permitId,
      profile.company_id ?? null,
      profile.is_superadmin,
      ["draft"]
    );

    const { error: clearError } = await supabase
      .from("work_permit_checklist_items")
      .update({ is_checked: false })
      .eq("permit_id", permitId);

    if (clearError) {
      throw new Error(clearError.message);
    }

    if (checkedIds.length > 0) {
      const { error: markError } = await supabase
        .from("work_permit_checklist_items")
        .update({ is_checked: true })
        .eq("permit_id", permitId)
        .in("id", checkedIds);

      if (markError) {
        throw new Error(markError.message);
      }
    }

    revalidatePath(`/admin/permissoes-trabalho/${permitId}`);
    revalidatePath("/admin/permissoes-trabalho");
  }, { action: "update", entityType: "work_permit", description: "Atualização do checklist da PT" });
}

const approveSchema = z.object({
  permit_id: z.string().uuid(),
  employee_signature_data_url: z.string().min(1, "Assinatura do colaborador e obrigatoria"),
  technician_signature_data_url: z.string().min(1, "Assinatura do tecnico e obrigatoria"),
});

export async function approveWorkPermit(formData: FormData) {
  return withLogging(async () => {
    const { supabase, profile } = await requirePermission("pt-approve");

    const payload = approveSchema.safeParse({
      permit_id: formData.get("permit_id"),
      employee_signature_data_url:
        formData.get("employee_signature_data_url")?.toString().trim() ?? "",
      technician_signature_data_url:
        formData.get("technician_signature_data_url")?.toString().trim() ?? "",
    });

    if (!payload.success) {
      throw new Error(payload.error.issues[0]?.message ?? "Dados invalidos para aprovacao");
    }

    validateSignatureDataUrl(payload.data.employee_signature_data_url, "Assinatura do colaborador");
    validateSignatureDataUrl(payload.data.technician_signature_data_url, "Assinatura do tecnico");

    const permit = await assertPermitScope(
      supabase,
      payload.data.permit_id,
      profile.company_id ?? null,
      profile.is_superadmin,
      ["draft"]
    );

    if (new Date(permit.expires_at) <= new Date()) {
      throw new Error("Nao e possivel aprovar uma PT vencida");
    }

    const { data: checklistItems, error: checklistError } = await supabase
      .from("work_permit_checklist_items")
      .select("id,is_checked")
      .eq("permit_id", payload.data.permit_id);

    if (checklistError) {
      throw new Error(checklistError.message);
    }

    if (!checklistItems?.length || checklistItems.some((item) => !item.is_checked)) {
      throw new Error("Checklist deve estar 100% concluido antes da aprovacao");
    }

    const { error } = await supabase
      .from("work_permits")
      .update({
        status: "active",
        approved_by_user_id: profile.id,
        employee_signature_data_url: payload.data.employee_signature_data_url,
        technician_signature_data_url: payload.data.technician_signature_data_url,
      })
      .eq("id", payload.data.permit_id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/admin/permissoes-trabalho/${payload.data.permit_id}`);
    revalidatePath("/admin/permissoes-trabalho");
  }, { action: "approve", entityType: "work_permit", description: "Aprovação de PT" });
}

export async function cancelWorkPermit(formData: FormData) {
  return withLogging(async () => {
    const { supabase, profile } = await requirePermission("pt-approve");
    const permitId = z.string().uuid().parse(formData.get("permit_id"));

    await assertPermitScope(supabase, permitId, profile.company_id ?? null, profile.is_superadmin, [
      "draft",
      "active",
    ]);

    const { error } = await supabase
      .from("work_permits")
      .update({ status: "cancelled" })
      .eq("id", permitId);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/admin/permissoes-trabalho/${permitId}`);
    revalidatePath("/admin/permissoes-trabalho");
  }, { action: "reject", entityType: "work_permit", description: "Cancelamento de PT" });
}

export async function syncExpiredWorkPermits() {
  return withLogging(async () => {
    const { supabase, profile } = await requirePermission("pt-approve");

    let query = supabase
      .from("work_permits")
      .update({ status: "expired" })
      .eq("status", "active")
      .lt("expires_at", new Date().toISOString());

    if (!profile.is_superadmin && profile.company_id) {
      query = query.eq("company_id", profile.company_id);
    }

    const { error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/admin/permissoes-trabalho");
  }, { action: "update", entityType: "work_permit", description: "Sincronização de PTs vencidas" });
}
