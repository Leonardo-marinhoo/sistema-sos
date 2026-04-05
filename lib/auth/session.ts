import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppPermission } from "@/lib/auth/permissions";

export async function requireSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("app_users")
    .select("id,full_name,email,company_id,role,is_superadmin")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/login");
  }

  const { data: rolePermissions } = await supabase
    .from("role_permissions")
    .select("permissions(code)")
    .eq("role", profile.role);

  const permissions = (rolePermissions ?? [])
    .map((item) => {
      const rel = item.permissions as { code?: string } | Array<{ code?: string }> | null;
      if (Array.isArray(rel)) {
        return rel[0]?.code;
      }
      return rel?.code;
    })
    .filter((code): code is string => Boolean(code));

  return { user, profile, supabase, permissions };
}

export async function requireSuperAdmin() {
  const session = await requireSession();
  if (!session.profile.is_superadmin) {
    redirect("/dashboard");
  }
  return session;
}

export async function requirePermission(permission: AppPermission) {
  const session = await requireSession();

  if (!session.profile.is_superadmin && !session.permissions.includes(permission)) {
    redirect("/dashboard");
  }

  return session;
}
