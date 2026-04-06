import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission, requireSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { APP_USER_LIST_WITH_COMPANY_AND_JOB_SELECT } from "@/lib/supabase/selects";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { columns, columnsWithoutCompany, type User } from "./columns";

export default async function AdminUsersPage() {
  await requirePermission("user-manage");
  const { profile } = await requireSession();

  // Usar supabaseAdmin para ignorar RLS e aplicar filtro manualmente
  const { data: usersData, error } = profile.is_superadmin
    ? await supabaseAdmin
        .from("app_users")
        .select(APP_USER_LIST_WITH_COMPANY_AND_JOB_SELECT)
        .order("created_at", { ascending: false })
    : await supabaseAdmin
        .from("app_users")
        .select(APP_USER_LIST_WITH_COMPANY_AND_JOB_SELECT)
        .eq("company_id", profile.company_id!)
        .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar usuários:", error);
  }

  const users: User[] = (usersData || []).map((user) => {
    const companyRel = user.companies as { name?: string } | Array<{ name?: string }> | null;
    const companyName = Array.isArray(companyRel) ? companyRel[0]?.name : companyRel?.name;
    const jobRel = user.job as { name?: string } | Array<{ name?: string }> | null;
    const jobName = Array.isArray(jobRel) ? jobRel[0]?.name : jobRel?.name;
    return {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      photo_url: user.photo_url,
      is_active: user.is_active,
      company_name: companyName ?? null,
      job_name: jobName ?? null,
      created_at: user.created_at,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {profile.is_superadmin ? "Administração SaaS" : "Gestão da Empresa"}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            {profile.is_superadmin 
              ? "Gestão de todos os usuários do sistema." 
              : "Gestão de usuários da sua empresa."}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/usuarios/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo usuário
          </Link>
        </Button>
      </div>

      <DataTable
        columns={profile.is_superadmin ? columns : columnsWithoutCompany}
        data={users}
        searchKey="full_name"
        searchPlaceholder="Buscar por nome..."
      />
    </div>
  );
}
