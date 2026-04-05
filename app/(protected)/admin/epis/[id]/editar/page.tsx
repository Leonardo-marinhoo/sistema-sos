import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormWithToast } from "@/components/ui/form-with-toast";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateEpi } from "@/app/(protected)/admin/epis/actions";
import { requirePermission, requireSession } from "@/lib/auth/session";

export default async function EditEpiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("epi-deliver");
  const { supabase, profile } = await requireSession();

  let query = supabase
    .from("epis")
    .select("id,company_id,code,name,category,default_validity_days,companies(name)")
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/epis/${epi.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">EPIs</p>
          <h1 className="text-3xl font-bold tracking-tight">Editar EPI</h1>
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Atualizar dados do EPI</CardTitle>
          <CardDescription>Revise identificacao, categoria e politica de validade padrao.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormWithToast
            action={updateEpi}
            successMessage="EPI atualizado com sucesso!"
            redirectTo={`/admin/epis/${epi.id}`}
            className="space-y-6"
          >
            <input type="hidden" name="id" value={epi.id} />
            <input type="hidden" name="company_id" value={epi.company_id} />

            {profile.is_superadmin && (
              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input id="company" value={companyName ?? "-"} disabled className="bg-muted" />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Codigo</Label>
                <Input id="code" required name="code" defaultValue={epi.code} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" required name="name" defaultValue={epi.name} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input id="category" required name="category" defaultValue={epi.category} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_validity_days">Validade padrao (dias)</Label>
                <Input
                  id="default_validity_days"
                  required
                  min={1}
                  type="number"
                  name="default_validity_days"
                  defaultValue={String(epi.default_validity_days)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <SubmitButton loadingText="Salvando...">Salvar alteracoes</SubmitButton>
              <Button variant="outline" asChild>
                <Link href={`/admin/epis/${epi.id}`}>Cancelar</Link>
              </Button>
            </div>
          </FormWithToast>
        </CardContent>
      </Card>
    </div>
  );
}
