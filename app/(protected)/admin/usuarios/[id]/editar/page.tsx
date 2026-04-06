import Link from "next/link";
import { notFound } from "next/navigation";
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
import { updateUser } from "@/app/(protected)/admin/usuarios/actions";
import { requirePermission, requireSession } from "@/lib/auth/session";
import { APP_USER_EDIT_WITH_COMPANY_AND_JOB_SELECT } from "@/lib/supabase/selects";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("user-manage");
  const { supabase, profile } = await requireSession();

  let query = supabase
    .from("app_users")
    .select(APP_USER_EDIT_WITH_COMPANY_AND_JOB_SELECT)
    .eq("id", id);

  if (!profile.is_superadmin && profile.company_id) {
    query = query.eq("company_id", profile.company_id);
  }

  const { data: user } = await query.maybeSingle();

  if (!user) notFound();

  const jobs: Array<{ id: string; name: string }> = [];
  if (user.company_id) {
    const { data: jobsData } = await supabase
      .from("jobs")
      .select("id,name")
      .eq("company_id", user.company_id)
      .order("name", { ascending: true });

    if (jobsData) {
      jobs.push(...jobsData);
    }
  }

  const companyRel = user.companies as { name?: string } | Array<{ name?: string }> | null;
  const companyName = Array.isArray(companyRel) ? companyRel[0]?.name : companyRel?.name;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/usuarios/${user.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Usuários
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Editar usuário</h1>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Atualizar informações</CardTitle>
          <CardDescription>
            Revise os dados de perfil, vinculo de cargo e status de acesso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormWithToast 
            action={updateUser} 
            successMessage="Usuário atualizado com sucesso!"
            redirectTo={`/admin/usuarios/${user.id}`}
            className="space-y-6"
          >
            <input type="hidden" name="id" value={user.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome completo</Label>
                <Input
                  id="full_name"
                  required
                  name="full_name"
                  defaultValue={user.full_name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            {profile.is_superadmin && (
              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input
                  id="company"
                  value={companyName ?? "Global"}
                  disabled
                  className="bg-muted"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="photo_url">Foto (URL opcional)</Label>
              <Input
                id="photo_url"
                name="photo_url"
                type="url"
                defaultValue={user.photo_url ?? ""}
                placeholder="https://exemplo.com/foto.jpg"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role">Perfil</Label>
                <Select name="role" defaultValue={user.role}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Colaborador</SelectItem>
                    <SelectItem value="safety_technician">Técnico de segurança</SelectItem>
                    <SelectItem value="company_admin">Admin da empresa</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Define permissao e escopo operacional do usuario.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_id">Cargo</Label>
                <Select name="job_id" defaultValue={user.job_id ?? "none"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem cargo</SelectItem>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Opcional para papeis de gestao, recomendado para colaborador.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="is_active">Status</Label>
                <Select name="is_active" defaultValue={user.is_active ? "true" : "false"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Usuarios inativos nao conseguem autenticar no sistema.</p>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <SubmitButton loadingText="Salvando...">Salvar alterações</SubmitButton>
              <Button variant="outline" asChild>
                <Link href={`/admin/usuarios/${user.id}`}>Cancelar</Link>
              </Button>
            </div>
          </FormWithToast>
        </CardContent>
      </Card>
    </div>
  );
}
