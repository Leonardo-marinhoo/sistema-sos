"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission, requireSession } from "@/lib/auth/session";

const schema = z.object({
  epi_id: z.string().uuid(),
  reason: z.string().min(3),
  evidence_photo_url: z.string().url(),
});

export async function createExchangeRequest(formData: FormData) {
  const { supabase, profile } = await requirePermission("epi-exchange-request");

  if (!profile.company_id) throw new Error("Colaborador sem empresa vinculada");

  const parsed = schema.safeParse({
    epi_id: formData.get("epi_id"),
    reason: formData.get("reason"),
    evidence_photo_url: formData.get("evidence_photo_url"),
  });

  if (!parsed.success) throw new Error("Dados invalidos para solicitacao");

  const { error } = await supabase.from("epi_exchange_requests").insert({
    company_id: profile.company_id,
    employee_user_id: profile.id,
    epi_id: parsed.data.epi_id,
    reason: parsed.data.reason,
    evidence_photo_url: parsed.data.evidence_photo_url,
    created_by_user_id: profile.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/colaborador/trocas-epi");
}

export async function deleteOwnPendingRequest(formData: FormData) {
  const { supabase, profile } = await requireSession();
  const id = z.string().uuid().parse(formData.get("id"));

  const { error } = await supabase
    .from("epi_exchange_requests")
    .delete()
    .eq("id", id)
    .eq("employee_user_id", profile.id)
    .eq("status", "pending");

  if (error) throw new Error(error.message);
  revalidatePath("/colaborador/trocas-epi");
}
