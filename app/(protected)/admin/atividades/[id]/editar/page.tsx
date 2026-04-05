import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormWithToast } from "@/components/ui/form-with-toast";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateActivity } from "@/app/(protected)/admin/atividades/actions";
import { requirePermission, requireSession } from "@/lib/auth/session";

export default async function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("risk-manage");
  const { supabase, profile } = await requireSession();

  let query = supabase
    .from("work_activities")
    .select("id,company_id,code,title,nr_reference,companies(name)")
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/atividades/${activity.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Atividades de risco</p>
          <h1 className="text-3xl font-bold tracking-tight">Editar atividade</h1>
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Atualizar dados da atividade</CardTitle>
          <CardDescription>Ajuste as informacoes tecnicas e normativas do registro.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormWithToast
            action={updateActivity}
            successMessage="Atividade atualizada com sucesso!"
            redirectTo={`/admin/atividades/${activity.id}`}
            className="space-y-6"
          >
            <input type="hidden" name="id" value={activity.id} />
            <input type="hidden" name="company_id" value={activity.company_id} />

            {profile.is_superadmin && (
              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input id="company" value={companyName ?? "-"} disabled className="bg-muted" />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Codigo</Label>
                <Input id="code" required name="code" defaultValue={activity.code} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nr_reference">Referencia NR</Label>
                <Input id="nr_reference" required name="nr_reference" defaultValue={activity.nr_reference} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Titulo</Label>
              <Input id="title" required name="title" defaultValue={activity.title} />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <SubmitButton loadingText="Salvando...">Salvar alteracoes</SubmitButton>
              <Button variant="outline" asChild>
                <Link href={`/admin/atividades/${activity.id}`}>Cancelar</Link>
              </Button>
            </div>
          </FormWithToast>
        </CardContent>
      </Card>
    </div>
  );
}
