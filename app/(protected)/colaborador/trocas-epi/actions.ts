"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission, requireSession } from "@/lib/auth/session";
import { withLogging } from "@/lib/logger/server-action-logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  epi_id: z.string().uuid(),
  reason: z.string().min(3),
});

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const EVIDENCE_BUCKET = "exchange-evidence";

function getFileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName) return fromName.replace(/[^a-z0-9]/g, "").slice(0, 8);

  const fromType = file.type.split("/").pop()?.toLowerCase();
  return fromType ? fromType.replace(/[^a-z0-9]/g, "").slice(0, 8) : "jpg";
}

async function uploadEvidencePhoto(file: File, companyId: string, userId: string) {
  if (file.size === 0) {
    throw new Error("Anexe uma foto do EPI para enviar a solicitação");
  }

  if (file.size > MAX_PHOTO_SIZE) {
    throw new Error("A foto deve ter no máximo 5MB");
  }

  if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
    throw new Error("Use uma imagem JPG, PNG, WebP ou HEIC");
  }

  const adminSupabase = createSupabaseAdminClient();

  await adminSupabase.storage.createBucket(EVIDENCE_BUCKET, {
    public: true,
    fileSizeLimit: MAX_PHOTO_SIZE,
    allowedMimeTypes: Array.from(ALLOWED_PHOTO_TYPES),
  });

  const extension = getFileExtension(file);
  const path = `${companyId}/${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await adminSupabase.storage
    .from(EVIDENCE_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`Falha ao enviar a foto: ${error.message}`);
  }

  const { data } = adminSupabase.storage
    .from(EVIDENCE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function createExchangeRequest(formData: FormData) {
  return withLogging(
    async () => {
      const { supabase, profile } = await requirePermission("epi-exchange-request");

      if (!profile.company_id) throw new Error("Colaborador sem empresa vinculada");

      const parsed = schema.safeParse({
        epi_id: formData.get("epi_id"),
        reason: formData.get("reason"),
      });

      if (!parsed.success) throw new Error("Dados invalidos para solicitacao");

      const evidencePhoto = formData.get("evidence_photo");
      if (!(evidencePhoto instanceof File)) {
        throw new Error("Anexe uma foto do EPI para enviar a solicitação");
      }

      const evidencePhotoUrl = await uploadEvidencePhoto(
        evidencePhoto,
        profile.company_id,
        profile.id,
      );

      const { error } = await supabase.from("epi_exchange_requests").insert({
        company_id: profile.company_id,
        employee_user_id: profile.id,
        epi_id: parsed.data.epi_id,
        reason: parsed.data.reason,
        evidence_photo_url: evidencePhotoUrl,
        created_by_user_id: profile.id,
      });

      if (error) throw new Error(error.message);
      revalidatePath("/colaborador/trocas-epi");
    },
    {
      action: "create",
      entityType: "epi_exchange_request",
    }
  );
}

export async function deleteOwnPendingRequest(formData: FormData) {
  return withLogging(
    async () => {
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
    },
    {
      action: "delete",
      entityType: "epi_exchange_request",
    }
  );
}
