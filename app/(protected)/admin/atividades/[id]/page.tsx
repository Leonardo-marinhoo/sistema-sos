import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FormWithToast } from "@/components/ui/form-with-toast";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteActivity } from "@/app/(protected)/admin/atividades/actions";
import { requirePermission, requireSession } from "@/lib/auth/session";

export default async function ActivityViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("risk-manage");
  const { supabase, profile } = await requireSession();

  let query = supabase
    .from("work_activities")
    .select("id,company_id,code,title,nr_reference,companies(name),created_at")
    .eq("id", id);

  if (!profile.is_superadmin && profile.company_id) {
    query = query.eq("company_id", profile.company_id);
  }

  const { data: activity } = await query.maybeSingle();
  if (!activity) notFound();

  const companyRel = activity.companies as { name?: string } | Array<{ name?: string }> | null;
  const companyName = Array.isArray(companyRel) ? companyRel[0]?.name : companyRel?.name;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/atividades">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Atividades de risco</p>
            <h1 className="text-3xl font-bold tracking-tight">{activity.code} - {activity.title}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/atividades/${activity.id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <FormWithToast action={deleteActivity} successMessage="Atividade excluida com sucesso!" redirectTo="/admin/atividades">
            <input type="hidden" name="id" value={activity.id} />
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
            <CardTitle>Dados da atividade</CardTitle>
            <CardDescription>Informacoes tecnicas do risco cadastrado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Codigo</span>
              <span className="font-medium">{activity.code}</span>
            </div>
            <Separator />
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">Titulo</p>
              <p className="font-medium">{activity.title}</p>
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
            <CardTitle>Conformidade</CardTitle>
            <CardDescription>Referencias normativas e historico do registro.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Referencia NR</span>
              {activity.nr_reference ? (
                <Badge variant="secondary">{activity.nr_reference}</Badge>
              ) : (
                <span className="font-medium">Nao informada</span>
              )}
            </div>
            <Separator />
            <div className="rounded-lg border p-3 text-sm">
              <p className="text-muted-foreground">Criado em</p>
              <p className="font-medium">{new Date(activity.created_at).toLocaleString("pt-BR")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
