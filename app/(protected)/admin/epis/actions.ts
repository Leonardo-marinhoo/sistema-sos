"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission, requireSession } from "@/lib/auth/session";

const schema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  code: z.string().min(2),
  name: z.string().min(2),
  category: z.string().min(2),
  default_validity_days: z.coerce.number().int().positive(),
});

export async function createEpi(formData: FormData) {
  const { supabase, profile } = await requirePermission("epi-deliver");
  const parsed = schema.safeParse({
    company_id: formData.get("company_id"),
    code: formData.get("code"),
    name: formData.get("name"),
    category: formData.get("category"),
    default_validity_days: formData.get("default_validity_days"),
  });
  if (!parsed.success) throw new Error("Dados invalidos");
  if (!profile.is_superadmin && parsed.data.company_id !== profile.company_id) throw new Error("Sem permissao");

  const { error } = await supabase.from("epis").insert({
    ...parsed.data,
    created_by_user_id: profile.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/epis");
}

export async function updateEpi(formData: FormData) {
  const { supabase } = await requirePermission("epi-deliver");
  const parsed = schema.safeParse({
    id: formData.get("id"),
    company_id: formData.get("company_id"),
    code: formData.get("code"),
    name: formData.get("name"),
    category: formData.get("category"),
    default_validity_days: formData.get("default_validity_days"),
  });
  if (!parsed.success || !parsed.data.id) throw new Error("Dados invalidos");

  const { error } = await supabase
    .from("epis")
    .update({
      code: parsed.data.code,
      name: parsed.data.name,
      category: parsed.data.category,
      default_validity_days: parsed.data.default_validity_days,
    })
    .eq("id", parsed.data.id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/epis");
}

export async function deleteEpi(formData: FormData) {
  const { supabase } = await requirePermission("epi-deliver");
  const id = z.string().uuid().parse(formData.get("id"));
  const { error } = await supabase.from("epis").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/epis");
}

export async function getEpiScopeCompanies() {
  const { supabase, profile } = await requireSession();
  if (profile.is_superadmin) {
    const { data } = await supabase.from("companies").select("id,name").order("name");
    return data ?? [];
  }

  const { data } = await supabase.from("companies").select("id,name").eq("id", profile.company_id).order("name");
  return data ?? [];
}
