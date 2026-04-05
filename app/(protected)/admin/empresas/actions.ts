"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth/session";

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  legal_name: z.string().min(2),
  document_number: z.string().min(8),
});

export async function createCompany(formData: FormData) {
  const { supabase, profile } = await requireSuperAdmin();
  const parsed = schema.safeParse({
    name: formData.get("name"),
    legal_name: formData.get("legal_name"),
    document_number: formData.get("document_number"),
  });

  if (!parsed.success) throw new Error("Dados invalidos para empresa");

  const { error } = await supabase.from("companies").insert({
    ...parsed.data,
    created_by_user_id: profile.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/empresas");
}

export async function updateCompany(formData: FormData) {
  const { supabase } = await requireSuperAdmin();

  const parsed = schema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    legal_name: formData.get("legal_name"),
    document_number: formData.get("document_number"),
  });

  if (!parsed.success || !parsed.data.id) throw new Error("Dados invalidos para atualizacao");

  const { error } = await supabase
    .from("companies")
    .update({
      name: parsed.data.name,
      legal_name: parsed.data.legal_name,
      document_number: parsed.data.document_number,
    })
    .eq("id", parsed.data.id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/empresas");
}

export async function deleteCompany(formData: FormData) {
  const { supabase } = await requireSuperAdmin();
  const id = z.string().uuid().parse(formData.get("id"));
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/empresas");
}
