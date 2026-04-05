import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormWithToast } from "@/components/ui/form-with-toast";
import { SubmitButton } from "@/components/ui/submit-button";
import { createCompany } from "@/app/(protected)/admin/empresas/actions";
import { requireSuperAdmin } from "@/lib/auth/session";

export default async function NewCompanyPage() {
  await requireSuperAdmin();

  return (
    <div className="flex flex-col gap-6">
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
          <h1 className="text-3xl font-bold tracking-tight">Nova empresa</h1>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informações da empresa</CardTitle>
          <CardDescription>
            Preencha os dados para cadastrar uma nova empresa no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormWithToast 
            action={createCompany} 
            successMessage="Empresa criada com sucesso!"
            redirectTo="/admin/empresas"
            className="space-y-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome fantasia</Label>
                <Input
                  id="name"
                  required
                  name="name"
                  placeholder="Nome fantasia"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legal_name">Razão social</Label>
                <Input
                  id="legal_name"
                  required
                  name="legal_name"
                  placeholder="Razão social"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="document_number">CNPJ</Label>
              <Input
                id="document_number"
                required
                name="document_number"
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <SubmitButton loadingText="Criando...">Salvar empresa</SubmitButton>
              <Button variant="outline" asChild>
                <Link href="/admin/empresas">Cancelar</Link>
              </Button>
            </div>
          </FormWithToast>
        </CardContent>
      </Card>
    </div>
  );
}
