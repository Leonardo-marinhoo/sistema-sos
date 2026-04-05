"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";

const roleEnum = z.enum(["superadmin", "company_admin", "safety_technician", "employee"]);

const userSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: roleEnum,
  company_id: z.string().uuid().optional().or(z.literal("")),
});

export async function createCompanyUser(formData: FormData) {
  const { supabase, profile } = await requireSuperAdmin();

  const parsed = userSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    company_id: formData.get("company_id"),
  });

  if (!parsed.success) {
    throw new Error("Dados invalidos para usuario.");
  }

  if (parsed.data.role !== "superadmin" && !parsed.data.company_id) {
    throw new Error("Usuarios nao-superadmin precisam de empresa.");
  }

  const createdAuthUser = await supabaseAdmin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      full_name: parsed.data.full_name,
    },
  });

  if (createdAuthUser.error || !createdAuthUser.data.user) {
    throw new Error(createdAuthUser.error?.message ?? "Falha ao criar credencial.");
  }

  const { error } = await supabase.from("app_users").upsert(
    {
      auth_user_id: createdAuthUser.data.user.id,
      email: parsed.data.email,
      full_name: parsed.data.full_name,
      role: parsed.data.role,
      company_id: parsed.data.role === "superadmin" ? null : parsed.data.company_id,
      is_superadmin: parsed.data.role === "superadmin",
      created_by_user_id: profile.id,
    },
    { onConflict: "auth_user_id" },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/users");
}
