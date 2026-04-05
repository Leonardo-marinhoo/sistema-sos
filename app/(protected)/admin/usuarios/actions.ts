"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission, requireSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";

const createSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["company_admin", "safety_technician", "employee"]),
  company_id: z.string().uuid(),
  job_id: z.union([z.string().uuid(), z.literal("none"), z.literal("")]).optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(2),
  role: z.enum(["company_admin", "safety_technician", "employee"]),
  is_active: z.enum(["true", "false"]),
  job_id: z.union([z.string().uuid(), z.literal("none"), z.literal("")]).optional(),
});

function normalizeJobId(raw: string | undefined) {
  if (!raw || raw === "none") return null;
  return raw;
}

export async function createUser(formData: FormData) {
  const { supabase, profile } = await requirePermission("user-manage");

  const payload = createSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    company_id: formData.get("company_id"),
    job_id: formData.get("job_id"),
  });

  if (!payload.success) throw new Error("Dados inválidos");

  if (!profile.is_superadmin && payload.data.company_id !== profile.company_id) {
    throw new Error("Sem permissão para criar usuários fora da sua empresa");
  }

  const normalizedJobId = payload.data.role === "employee" ? normalizeJobId(payload.data.job_id) : null;

  if (normalizedJobId) {
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id,company_id")
      .eq("id", normalizedJobId)
      .maybeSingle();

    if (jobError || !job) {
      throw new Error("Cargo informado não existe");
    }

    if (job.company_id !== payload.data.company_id) {
      throw new Error("Cargo precisa pertencer à mesma empresa do usuário");
    }
  }

  // Check if email already exists in app_users
  const { data: existingAppUser } = await supabase
    .from("app_users")
    .select("id")
    .eq("email", payload.data.email)
    .maybeSingle();

  if (existingAppUser) {
    throw new Error("Este email já está cadastrado no sistema");
  }

  // Create auth user - this will trigger handle_auth_user_created() 
  // which automatically creates an app_user with role='employee'
  const authUser = await supabaseAdmin.auth.admin.createUser({
    email: payload.data.email,
    password: payload.data.password,
    email_confirm: true,
    user_metadata: { full_name: payload.data.full_name },
  });

  if (authUser.error) {
    if (authUser.error.message.includes("already been registered") || 
        authUser.error.message.includes("already exists")) {
      throw new Error("Este email já está cadastrado no sistema de autenticação");
    }
    throw new Error(authUser.error.message);
  }

  if (!authUser.data.user) throw new Error("Falha ao criar usuário de autenticação");

  // The trigger already created the app_user, now we UPDATE it with the correct data
  const { error } = await supabaseAdmin.from("app_users").update({
    full_name: payload.data.full_name,
    role: payload.data.role,
    company_id: payload.data.company_id,
    job_id: normalizedJobId,
    created_by_user_id: profile.id,
  }).eq("auth_user_id", authUser.data.user.id);

  if (error) {
    // Rollback: delete the auth user if update fails
    await supabaseAdmin.auth.admin.deleteUser(authUser.data.user.id);
    throw new Error(error.message);
  }
  
  revalidatePath("/admin/usuarios");
}

export async function updateUser(formData: FormData) {
  const { supabase, profile } = await requirePermission("user-manage");
  const payload = updateSchema.safeParse({
    id: formData.get("id"),
    full_name: formData.get("full_name"),
    role: formData.get("role"),
    is_active: formData.get("is_active"),
    job_id: formData.get("job_id"),
  });

  if (!payload.success) throw new Error("Dados invalidos");

  const { data: target } = await supabase
    .from("app_users")
    .select("company_id")
    .eq("id", payload.data.id)
    .single();

  if (!target) {
    throw new Error("Usuário não encontrado");
  }

  if (!profile.is_superadmin) {
    if (target?.company_id !== profile.company_id) {
      throw new Error("Sem permissao para editar esse usuario");
    }
  }

  const normalizedJobId = payload.data.role === "employee" ? normalizeJobId(payload.data.job_id) : null;

  if (normalizedJobId) {
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id,company_id")
      .eq("id", normalizedJobId)
      .maybeSingle();

    if (jobError || !job) {
      throw new Error("Cargo informado não existe");
    }

    if (job.company_id !== target.company_id) {
      throw new Error("Cargo precisa pertencer à mesma empresa do usuário");
    }
  }

  const { data: updatedUser, error } = await supabaseAdmin
    .from("app_users")
    .update({
      full_name: payload.data.full_name,
      role: payload.data.role,
      job_id: normalizedJobId,
      is_active: payload.data.is_active === "true",
    })
    .eq("id", payload.data.id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!updatedUser) throw new Error("Nao foi possivel atualizar o usuario");
  revalidatePath("/admin/usuarios");
}

export async function deleteUser(formData: FormData) {
  const { supabase, profile } = await requirePermission("user-manage");
  const id = z.string().uuid().parse(formData.get("id"));

  const { data: target } = await supabase.from("app_users").select("auth_user_id,company_id,is_superadmin").eq("id", id).single();

  if (!target) throw new Error("Usuario nao encontrado");
  if (target.is_superadmin) throw new Error("Nao e permitido excluir superadmin");
  if (!profile.is_superadmin && target.company_id !== profile.company_id) {
    throw new Error("Sem permissao para excluir esse usuario");
  }

  const authDelete = await supabaseAdmin.auth.admin.deleteUser(target.auth_user_id);
  if (authDelete.error) throw new Error(authDelete.error.message);

  const { data: deletedUser, error } = await supabaseAdmin
    .from("app_users")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!deletedUser) throw new Error("Nao foi possivel excluir o usuario");

  revalidatePath("/admin/usuarios");
}

export async function getUserCreationScope() {
  const { supabase, profile } = await requireSession();
  if (profile.is_superadmin) {
    const { data } = await supabase.from("companies").select("id,name").order("name");
    return data ?? [];
  }

  const { data } = await supabase
    .from("companies")
    .select("id,name")
    .eq("id", profile.company_id)
    .order("name");

  return data ?? [];
}
