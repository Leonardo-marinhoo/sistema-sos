import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FormWithToast } from "@/components/ui/form-with-toast";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteCompany } from "@/app/(protected)/admin/empresas/actions";
import { requireSuperAdmin } from "@/lib/auth/session";

export default async function CompanyViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireSuperAdmin();

  const { data: company } = await supabase
    .from("companies")
    .select("id,name,legal_name,document_number,is_active,created_at,updated_at")
    .eq("id", id)
    .maybeSingle();

  if (!company) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/empresas">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Empresas
            </p>
            <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/empresas/${company.id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <FormWithToast 
            action={deleteCompany} 
            successMessage="Empresa excluída com sucesso!"
            redirectTo="/admin/empresas"
          >
            <input type="hidden" name="id" value={company.id} />
            <SubmitButton variant="destructive" loadingText="Excluindo...">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </SubmitButton>
          </FormWithToast>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações da empresa</CardTitle>
            <CardDescription>Dados cadastrais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Nome fantasia</span>
              <span className="font-medium">{company.name}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Razão social</span>
              <span className="font-medium">{company.legal_name}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">CNPJ</span>
              <span className="font-mono font-medium">{company.document_number}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Situação atual da empresa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={company.is_active ? "success" : "destructive"}>
                {company.is_active ? "Ativa" : "Inativa"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
            <CardDescription>Datas importantes do registro.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <span className="text-sm text-muted-foreground">Criada em</span>
                <span className="font-medium">
                  {new Date(company.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <span className="text-sm text-muted-foreground">Atualizada em</span>
                <span className="font-medium">
                  {new Date(company.updated_at).toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
