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
import { createUser, getUserCreationScope } from "@/app/(protected)/admin/usuarios/actions";
import { requirePermission, requireSession } from "@/lib/auth/session";

export default async function NewUserPage() {
  await requirePermission("user-manage");
  const { profile, supabase } = await requireSession();
  const companies = await getUserCreationScope();
  const { data: jobsData } = profile.is_superadmin
    ? await supabase
        .from("jobs")
        .select("id,name,company_id,companies(name)")
        .order("name", { ascending: true })
    : await supabase
        .from("jobs")
        .select("id,name,company_id,companies(name)")
        .eq("company_id", profile.company_id)
        .order("name", { ascending: true });

  const jobs = (jobsData ?? []).map((job) => {
    const companyRel = job.companies as { name?: string } | Array<{ name?: string }> | null;
    const companyName = Array.isArray(companyRel) ? companyRel[0]?.name : companyRel?.name;
    return {
      id: job.id,
      name: job.name,
      companyName: companyName ?? null,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/usuarios">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Usuários
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Novo usuário</h1>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informações do usuário</CardTitle>
          <CardDescription>
            Preencha os dados para criar um novo usuário.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormWithToast 
            action={createUser} 
            successMessage="Usuário criado com sucesso!"
            redirectTo="/admin/usuarios"
            className="space-y-6"
          >
            {!profile.is_superadmin && profile.company_id && (
              <input type="hidden" name="company_id" value={profile.company_id} />
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome completo</Label>
                <Input
                  id="full_name"
                  required
                  name="full_name"
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  required
                  type="email"
                  name="email"
                  placeholder="usuario@empresa.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha inicial</Label>
              <Input
                id="password"
                required
                type="password"
                name="password"
                placeholder="••••••••"
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="photo_url">Foto (URL opcional)</Label>
              <Input
                id="photo_url"
                type="url"
                name="photo_url"
                placeholder="https://exemplo.com/foto.jpg"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role">Perfil</Label>
                <Select name="role" defaultValue="employee">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Colaborador</SelectItem>
                    <SelectItem value="safety_technician">Técnico de segurança</SelectItem>
                    {(profile.is_superadmin || profile.role === "company_admin") && (
                      <SelectItem value="company_admin">Admin da empresa</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_id">Cargo (opcional)</Label>
                <Select name="job_id" defaultValue="none">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem cargo</SelectItem>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.name}
                        {profile.is_superadmin && job.companyName ? ` - ${job.companyName}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
            </div>
            <div className="flex gap-3 pt-4">
              <SubmitButton loadingText="Criando...">Salvar usuário</SubmitButton>
              <Button variant="outline" asChild>
                <Link href="/admin/usuarios">Cancelar</Link>
              </Button>
            </div>
          </FormWithToast>
        </CardContent>
      </Card>
    </div>
  );
}
