import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormWithToast } from "@/components/ui/form-with-toast";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateCompany } from "@/app/(protected)/admin/empresas/actions";
import { requireSuperAdmin } from "@/lib/auth/session";

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireSuperAdmin();

  const { data: company } = await supabase
    .from("companies")
    .select("id,name,legal_name,document_number")
    .eq("id", id)
    .maybeSingle();

  if (!company) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/empresas/${company.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Empresas</p>
          <h1 className="text-3xl font-bold tracking-tight">Editar empresa</h1>
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Atualizar dados da empresa</CardTitle>
          <CardDescription>Revise informacoes cadastrais e mantenha o registro corporativo consistente.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormWithToast
            action={updateCompany}
            successMessage="Empresa atualizada com sucesso!"
            redirectTo={`/admin/empresas/${company.id}`}
            className="space-y-6"
          >
            <input type="hidden" name="id" value={company.id} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome fantasia</Label>
                <Input id="name" required name="name" defaultValue={company.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legal_name">Razao social</Label>
                <Input id="legal_name" required name="legal_name" defaultValue={company.legal_name} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="document_number">CNPJ</Label>
              <Input id="document_number" required name="document_number" defaultValue={company.document_number} />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <SubmitButton loadingText="Salvando...">Salvar alteracoes</SubmitButton>
              <Button variant="outline" asChild>
                <Link href={`/admin/empresas/${company.id}`}>Cancelar</Link>
              </Button>
            </div>
          </FormWithToast>
        </CardContent>
      </Card>
    </div>
  );
}
