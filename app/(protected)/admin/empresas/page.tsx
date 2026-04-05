import Link from "next/link";
import { Plus } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { columns, type Company } from "./columns";

export default async function AdminCompaniesPage() {
  const { supabase } = await requireSuperAdmin();
  const { data: companiesData } = await supabase
    .from("companies")
    .select("id,name,legal_name,document_number,is_active,created_at")
    .order("name", { ascending: true });

  const companies: Company[] = (companiesData || []).map((company) => ({
    id: company.id,
    name: company.name,
    legal_name: company.legal_name,
    document_number: company.document_number,
    is_active: company.is_active,
    created_at: company.created_at,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Administração
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
          <p className="text-muted-foreground">
            Listagem das empresas cadastradas no sistema.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/empresas/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nova empresa
          </Link>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={companies}
        searchKey="name"
        searchPlaceholder="Buscar por nome..."
      />
    </div>
  );
}
