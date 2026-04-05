import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormWithToast } from "@/components/ui/form-with-toast";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateJob } from "@/app/(protected)/admin/cargos/actions";
import { requirePermission, requireSession } from "@/lib/auth/session";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("user-manage");
  const { supabase, profile } = await requireSession();

  let query = supabase
    .from("jobs")
    .select("id,name,description,company_id,companies(name)")
    .eq("id", id);

  if (!profile.is_superadmin && profile.company_id) {
    query = query.eq("company_id", profile.company_id);
  }

  const { data: job } = await query.maybeSingle();
  if (!job) notFound();

  const companyRel = job.companies as { name?: string } | Array<{ name?: string }> | null;
  const companyName = Array.isArray(companyRel) ? companyRel[0]?.name : companyRel?.name;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/cargos/${job.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Cargos</p>
          <h1 className="text-3xl font-bold tracking-tight">Editar cargo</h1>
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Atualizar dados do cargo</CardTitle>
          <CardDescription>Mantenha o cadastro e descricao do cargo sempre alinhados ao processo operacional.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormWithToast
            action={updateJob}
            successMessage="Cargo atualizado com sucesso!"
            redirectTo={`/admin/cargos/${job.id}`}
            className="space-y-6"
          >
            <input type="hidden" name="id" value={job.id} />

            {profile.is_superadmin && (
              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input id="company" value={companyName ?? "-"} disabled className="bg-muted" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" required name="name" defaultValue={job.name} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descricao</Label>
              <Textarea id="description" name="description" defaultValue={job.description ?? ""} />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <SubmitButton loadingText="Salvando...">Salvar alteracoes</SubmitButton>
              <Button variant="outline" asChild>
                <Link href={`/admin/cargos/${job.id}`}>Cancelar</Link>
              </Button>
            </div>
          </FormWithToast>
        </CardContent>
      </Card>
    </div>
  );
}
