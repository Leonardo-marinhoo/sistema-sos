import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission, requireSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { columns, columnsWithoutCompany, type Job } from "./columns";

export default async function AdminJobsPage() {
  await requirePermission("user-manage");
  const { profile } = await requireSession();

  // Usar supabaseAdmin para ignorar RLS e aplicar filtro manualmente
  const { data: jobsData } = profile.is_superadmin
    ? await supabaseAdmin
        .from("jobs")
        .select("id,name,description,company_id,companies(name),created_at")
        .order("name", { ascending: true })
    : await supabaseAdmin
        .from("jobs")
        .select("id,name,description,company_id,companies(name),created_at")
        .eq("company_id", profile.company_id!)
        .order("name", { ascending: true });

  const jobs: Job[] = (jobsData || []).map((job) => {
    const companyRel = job.companies as { name?: string } | Array<{ name?: string }> | null;
    const companyName = Array.isArray(companyRel) ? companyRel[0]?.name : companyRel?.name;
    return {
      id: job.id,
      name: job.name,
      description: job.description,
      company_name: companyName ?? null,
      created_at: job.created_at,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {profile.is_superadmin ? "Administração SaaS" : "Gestão da Empresa"}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Cargos</h1>
          <p className="text-muted-foreground">
            Definição de cargos da empresa.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/cargos/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo cargo
          </Link>
        </Button>
      </div>

      <DataTable
        columns={profile.is_superadmin ? columns : columnsWithoutCompany}
        data={jobs}
        searchKey="name"
        searchPlaceholder="Buscar por nome..."
      />
    </div>
  );
}
