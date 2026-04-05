import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { createJob, getJobScopeCompanies } from "@/app/(protected)/admin/cargos/actions";
import { requirePermission, requireSession } from "@/lib/auth/session";

export default async function NewJobPage() {
  await requirePermission("user-manage");
  const { profile } = await requireSession();
  const companies = await getJobScopeCompanies();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/cargos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Cargos
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Novo cargo</h1>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informações do cargo</CardTitle>
          <CardDescription>
            Preencha os dados para cadastrar um novo cargo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormWithToast 
            action={createJob} 
            successMessage="Cargo criado com sucesso!"
            redirectTo="/admin/cargos"
            className="space-y-6"
          >
            {!profile.is_superadmin && profile.company_id && (
              <input type="hidden" name="company_id" value={profile.company_id} />
            )}

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
              <Label htmlFor="name">Nome do cargo</Label>
              <Input id="name" required name="name" placeholder="Ex: Técnico de segurança" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" name="description" placeholder="Descrição das responsabilidades do cargo" />
            </div>
            <div className="flex gap-3 pt-4">
              <SubmitButton loadingText="Criando...">Salvar cargo</SubmitButton>
              <Button variant="outline" asChild>
                <Link href="/admin/cargos">Cancelar</Link>
              </Button>
            </div>
          </FormWithToast>
        </CardContent>
      </Card>
    </div>
  );
}
