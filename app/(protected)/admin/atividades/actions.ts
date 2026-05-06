"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission, requireSession } from "@/lib/auth/session";
import { withLogging } from "@/lib/logger/server-action-logger";

const schema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  code: z.string().min(2),
  title: z.string().min(2),
  nr_reference: z.string().min(2),
});

export async function createActivity(formData: FormData) {
  return withLogging(async () => {
    const { supabase, profile } = await requirePermission("risk-manage");
    const parsed = schema.safeParse({
      company_id: formData.get("company_id"),
      code: formData.get("code"),
      title: formData.get("title"),
      nr_reference: formData.get("nr_reference"),
    });

    if (!parsed.success) throw new Error("Dados invalidos");
    if (!profile.is_superadmin && parsed.data.company_id !== profile.company_id) throw new Error("Sem permissao");

    const { error } = await supabase.from("work_activities").insert({
      ...parsed.data,
      created_by_user_id: profile.id,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/admin/atividades");
  }, { action: "create", entityType: "work_activity", description: "Criação de atividade" });
}

export async function updateActivity(formData: FormData) {
  return withLogging(async () => {
    const { supabase } = await requirePermission("risk-manage");
    const parsed = schema.safeParse({
      id: formData.get("id"),
      company_id: formData.get("company_id"),
      code: formData.get("code"),
      title: formData.get("title"),
      nr_reference: formData.get("nr_reference"),
    });

    if (!parsed.success || !parsed.data.id) throw new Error("Dados invalidos");

    const { error } = await supabase
      .from("work_activities")
      .update({
        code: parsed.data.code,
        title: parsed.data.title,
        nr_reference: parsed.data.nr_reference,
      })
      .eq("id", parsed.data.id);

    if (error) throw new Error(error.message);
    revalidatePath("/admin/atividades");
  }, { action: "update", entityType: "work_activity", description: "Atualização de atividade" });
}

export async function deleteActivity(formData: FormData) {
  return withLogging(async () => {
    const { supabase } = await requirePermission("risk-manage");
    const id = z.string().uuid().parse(formData.get("id"));
    const { error } = await supabase.from("work_activities").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/atividades");
  }, { action: "delete", entityType: "work_activity", description: "Exclusão de atividade" });
}

export async function getActivityScopeCompanies() {
  const { supabase, profile } = await requireSession();
  if (profile.is_superadmin) {
    const { data } = await supabase.from("companies").select("id,name").order("name");
    return data ?? [];
  }
  const { data } = await supabase.from("companies").select("id,name").eq("id", profile.company_id).order("name");
  return data ?? [];
}
