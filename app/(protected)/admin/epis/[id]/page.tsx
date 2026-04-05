import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FormWithToast } from "@/components/ui/form-with-toast";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteEpi } from "@/app/(protected)/admin/epis/actions";
import { requirePermission, requireSession } from "@/lib/auth/session";

export default async function EpiViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("epi-deliver");
  const { supabase, profile } = await requireSession();

  let query = supabase
    .from("epis")
    .select("id,company_id,code,name,category,default_validity_days,companies(name),created_at,updated_at")
    .eq("id", id);

  if (!profile.is_superadmin && profile.company_id) {
    query = query.eq("company_id", profile.company_id);
  }

  const { data: epi } = await query.maybeSingle();
  if (!epi) notFound();

  const companyRel = epi.companies as { name?: string } | Array<{ name?: string }> | null;
  const companyName = Array.isArray(companyRel) ? companyRel[0]?.name : companyRel?.name;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/epis">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">EPIs</p>
            <h1 className="text-3xl font-bold tracking-tight">{epi.code} - {epi.name}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/epis/${epi.id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <FormWithToast action={deleteEpi} successMessage="EPI excluido com sucesso!" redirectTo="/admin/epis">
            <input type="hidden" name="id" value={epi.id} />
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
            <CardTitle>Informacoes do EPI</CardTitle>
            <CardDescription>Dados tecnicos do equipamento cadastrado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Codigo</span>
              <span className="font-medium">{epi.code}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Nome</span>
              <span className="font-medium text-right">{epi.name}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Categoria</span>
              <Badge variant="secondary">{epi.category}</Badge>
            </div>
            {profile.is_superadmin && (
              <>
                <Separator />
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Empresa</span>
                  <span className="font-medium text-right">{companyName ?? "-"}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Validade e historico</CardTitle>
            <CardDescription>Controle de prazo padrao e trilha de atualizacoes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Validade padrao</p>
              <p className="mt-1 text-2xl font-semibold">{epi.default_validity_days} dias</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-3 text-sm">
                <p className="text-muted-foreground">Criado em</p>
                <p className="font-medium">{new Date(epi.created_at).toLocaleString("pt-BR")}</p>
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <p className="text-muted-foreground">Atualizado em</p>
                <p className="font-medium">{new Date(epi.updated_at).toLocaleString("pt-BR")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
