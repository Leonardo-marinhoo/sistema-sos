import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select-new";
import { FormWithToast } from "@/components/ui/form-with-toast";
import { SubmitButton } from "@/components/ui/submit-button";
import { createEpi, getEpiScopeCompanies } from "@/app/(protected)/admin/epis/actions";
import { requirePermission, requireSession } from "@/lib/auth/session";

export default async function NewEpiPage() {
  await requirePermission("epi-deliver");
  const { profile } = await requireSession();
  const companies = await getEpiScopeCompanies();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/epis">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            EPIs
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Novo EPI</h1>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informações do EPI</CardTitle>
          <CardDescription>
            Preencha os dados para cadastrar um novo Equipamento de Proteção Individual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormWithToast 
            action={createEpi} 
            successMessage="EPI criado com sucesso!"
            redirectTo="/admin/epis"
            className="space-y-6"
          >
            {!profile.is_superadmin && profile.company_id && (
              <input type="hidden" name="company_id" value={profile.company_id} />
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {profile.is_superadmin && (
                <div className="space-y-2">
                  <Label htmlFor="company_id">Empresa</Label>
                  <Select name="company_id" defaultValue={companies[0]?.id ?? ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input id="code" required name="code" placeholder="EPI-001" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" required name="name" placeholder="Capacete de segurança" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input id="category" required name="category" placeholder="Cabeça" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_validity_days">Validade padrão (dias)</Label>
              <Input 
                id="default_validity_days" 
                required 
                type="number" 
                min={1} 
                name="default_validity_days" 
                placeholder="365" 
              />
            </div>
            <div className="flex gap-3 pt-4">
              <SubmitButton loadingText="Criando...">Salvar EPI</SubmitButton>
              <Button variant="outline" asChild>
                <Link href="/admin/epis">Cancelar</Link>
              </Button>
            </div>
          </FormWithToast>
        </CardContent>
      </Card>
    </div>
  );
}
