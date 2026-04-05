"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission, requireSession } from "@/lib/auth/session";

const schema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  name: z.string().min(2),
  description: z.string().optional(),
});

const kitItemSchema = z.object({
  job_id: z.string().uuid(),
  epi_id: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  is_mandatory: z.enum(["true", "false"]),
});

export async function createJob(formData: FormData) {
  const { supabase, profile } = await requirePermission("user-manage");
  const parsed = schema.safeParse({
    company_id: formData.get("company_id"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) throw new Error("Dados invalidos");
  if (!profile.is_superadmin && parsed.data.company_id !== profile.company_id) throw new Error("Sem permissao");

  const { error } = await supabase.from("jobs").insert({
    company_id: parsed.data.company_id,
    name: parsed.data.name,
    description: parsed.data.description,
    created_by_user_id: profile.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/cargos");
}

export async function updateJob(formData: FormData) {
  const { supabase } = await requirePermission("user-manage");
  const id = z.string().uuid().parse(formData.get("id"));
  const name = z.string().min(2).parse(formData.get("name"));
  const description = (formData.get("description") as string | null) ?? "";
  const { error } = await supabase.from("jobs").update({ name, description }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/cargos");
}

export async function deleteJob(formData: FormData) {
  const { supabase } = await requirePermission("user-manage");
  const id = z.string().uuid().parse(formData.get("id"));
  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/cargos");
}

export async function getJobScopeCompanies() {
  const { supabase, profile } = await requireSession();
  if (profile.is_superadmin) {
    const { data } = await supabase.from("companies").select("id,name").order("name");
    return data ?? [];
  }
  const { data } = await supabase.from("companies").select("id,name").eq("id", profile.company_id).order("name");
  return data ?? [];
}

export async function saveJobKitItem(formData: FormData) {
  const { supabase, profile } = await requirePermission("user-manage");

  const payload = kitItemSchema.safeParse({
    job_id: formData.get("job_id"),
    epi_id: formData.get("epi_id"),
    quantity: formData.get("quantity"),
    is_mandatory: formData.get("is_mandatory"),
  });

  if (!payload.success) {
    throw new Error("Dados inválidos para o kit do cargo");
  }

  const [{ data: job, error: jobError }, { data: epi, error: epiError }] = await Promise.all([
    supabase.from("jobs").select("id,company_id").eq("id", payload.data.job_id).maybeSingle(),
    supabase.from("epis").select("id,company_id").eq("id", payload.data.epi_id).maybeSingle(),
  ]);

  if (jobError || !job) {
    throw new Error("Cargo não encontrado");
  }

  if (epiError || !epi) {
    throw new Error("EPI não encontrado");
  }

  if (job.company_id !== epi.company_id) {
    throw new Error("Cargo e EPI precisam pertencer à mesma empresa");
  }

  if (!profile.is_superadmin && job.company_id !== profile.company_id) {
    throw new Error("Sem permissão para alterar kit deste cargo");
  }

  const { data: latestVersionRow } = await supabase
    .from("job_epi_kits")
    .select("version")
    .eq("job_id", payload.data.job_id)
    .eq("epi_id", payload.data.epi_id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latestVersionRow?.version ?? 0) + 1;

  const { error: insertError } = await supabase.from("job_epi_kits").insert({
    company_id: job.company_id,
    job_id: payload.data.job_id,
    epi_id: payload.data.epi_id,
    quantity: payload.data.quantity,
    is_mandatory: payload.data.is_mandatory === "true",
    version: nextVersion,
    created_by_user_id: profile.id,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  revalidatePath(`/admin/cargos/${payload.data.job_id}`);
  revalidatePath("/admin/cargos");
}
