import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission, requireSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { columns, columnsWithoutCompany, type Activity } from "./columns";

export default async function AdminActivitiesPage() {
  await requirePermission("risk-manage");
  const { profile } = await requireSession();

  // Usar supabaseAdmin para ignorar RLS e aplicar filtro manualmente
  const { data: activitiesData } = profile.is_superadmin
    ? await supabaseAdmin
        .from("work_activities")
        .select("id,company_id,code,title,nr_reference,companies(name),created_at")
        .order("title", { ascending: true })
    : await supabaseAdmin
        .from("work_activities")
        .select("id,company_id,code,title,nr_reference,companies(name),created_at")
        .eq("company_id", profile.company_id!)
        .order("title", { ascending: true });

  const activities: Activity[] = (activitiesData || []).map((activity) => {
    const companyRel = activity.companies as { name?: string } | Array<{ name?: string }> | null;
    const companyName = Array.isArray(companyRel) ? companyRel[0]?.name : companyRel?.name;
    return {
      id: activity.id,
      code: activity.code,
      title: activity.title,
      nr_reference: activity.nr_reference,
      company_name: companyName ?? null,
      created_at: activity.created_at,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {profile.is_superadmin ? "Administração SaaS" : "Gestão da Empresa"}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Atividades de Risco</h1>
          <p className="text-muted-foreground">
            Catálogo de atividades vinculadas às NRs.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/atividades/novo">
            <Plus className="mr-2 h-4 w-4" />
            Nova atividade
          </Link>
        </Button>
      </div>

      <DataTable
        columns={profile.is_superadmin ? columns : columnsWithoutCompany}
        data={activities}
        searchKey="title"
        searchPlaceholder="Buscar por título..."
      />
    </div>
  );
}
