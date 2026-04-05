import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePermission, requireSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { columns, columnsWithoutCompany, type Epi } from "./columns";

export default async function AdminEpisPage() {
  await requirePermission("epi-deliver");
  const { profile } = await requireSession();

  // Usar supabaseAdmin para ignorar RLS e aplicar filtro manualmente
  const { data: episData } = profile.is_superadmin
    ? await supabaseAdmin
        .from("epis")
        .select("id,code,name,category,default_validity_days,company_id,companies(name),created_at")
        .order("name", { ascending: true })
    : await supabaseAdmin
        .from("epis")
        .select("id,code,name,category,default_validity_days,company_id,companies(name),created_at")
        .eq("company_id", profile.company_id!)
        .order("name", { ascending: true });

  const epis: Epi[] = (episData || []).map((epi) => {
    const companyRel = epi.companies as { name?: string } | Array<{ name?: string }> | null;
    const companyName = Array.isArray(companyRel) ? companyRel[0]?.name : companyRel?.name;
    return {
      id: epi.id,
      code: epi.code,
      name: epi.name,
      category: epi.category,
      default_validity_days: epi.default_validity_days,
      company_name: companyName ?? null,
      created_at: epi.created_at,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {profile.is_superadmin ? "Administração SaaS" : "Gestão da Empresa"}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">EPIs</h1>
          <p className="text-muted-foreground">
            Catálogo de Equipamentos de Proteção Individual.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/epis/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo EPI
          </Link>
        </Button>
      </div>

      <DataTable
        columns={profile.is_superadmin ? columns : columnsWithoutCompany}
        data={epis}
        searchKey="name"
        searchPlaceholder="Buscar por nome..."
      />
    </div>
  );
}
