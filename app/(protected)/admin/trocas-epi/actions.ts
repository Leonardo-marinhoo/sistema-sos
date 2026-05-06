"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/session";
import { withLogging } from "@/lib/logger/server-action-logger";

const reviewSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  review_note: z.string().min(3, "Informe o motivo da resposta"),
});

export async function reviewExchangeRequest(formData: FormData) {
  return withLogging(
    async () => {
      const { supabase, profile } = await requirePermission("epi-exchange-review");

      const payload = reviewSchema.safeParse({
        id: formData.get("id"),
        status: formData.get("status"),
        review_note: formData.get("review_note"),
      });

      if (!payload.success) {
        throw new Error(payload.error.issues[0]?.message ?? "Dados inválidos");
      }

      const { data: request, error: requestError } = await supabase
        .from("epi_exchange_requests")
        .select("id,company_id,employee_user_id,status")
        .eq("id", payload.data.id)
        .maybeSingle();

      if (requestError || !request) {
        throw new Error("Solicitação não encontrada");
      }

      if (!profile.is_superadmin && request.company_id !== profile.company_id) {
        throw new Error("Sem permissão para responder solicitação fora da sua empresa");
      }

      if (request.status !== "pending") {
        throw new Error("Somente solicitações pendentes podem receber resposta");
      }

      const { error } = await supabase
        .from("epi_exchange_requests")
        .update({
          status: payload.data.status,
          review_note: payload.data.review_note,
          reviewed_by_user_id: profile.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", request.id)
        .eq("status", "pending");

      if (error) {
        throw new Error(error.message);
      }

      revalidatePath("/admin/trocas-epi");
      revalidatePath("/admin/entregas-epi/novo");
      revalidatePath("/colaborador/trocas-epi");
    },
    {
      action: "update",
      entityType: "epi_exchange_request",
      description: "Resposta de solicitação de troca de EPI",
    },
  );
}
