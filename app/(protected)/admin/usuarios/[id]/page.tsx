import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FormWithToast } from "@/components/ui/form-with-toast";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteUser } from "@/app/(protected)/admin/usuarios/actions";
import { requirePermission, requireSession } from "@/lib/auth/session";
import { APP_USER_DETAIL_WITH_COMPANY_AND_JOB_SELECT } from "@/lib/supabase/selects";

export default async function UserViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("user-manage");
  const { supabase, profile } = await requireSession();

  let query = supabase
    .from("app_users")
    .select(APP_USER_DETAIL_WITH_COMPANY_AND_JOB_SELECT)
    .eq("id", id);

  if (!profile.is_superadmin && profile.company_id) {
    query = query.eq("company_id", profile.company_id);
  }

  const { data: user } = await query.maybeSingle();

  if (!user) notFound();

  const companyRel = user.companies as { name?: string } | Array<{ name?: string }> | null;
  const companyName = Array.isArray(companyRel) ? companyRel[0]?.name : companyRel?.name;
  const jobRel = user.job as { name?: string } | Array<{ name?: string }> | null;
  const jobName = Array.isArray(jobRel) ? jobRel[0]?.name : jobRel?.name;

  const roleLabels: Record<string, string> = {
    employee: "Colaborador",
    safety_technician: "Técnico de Segurança",
    company_admin: "Admin Empresa",
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            <h1 className="text-3xl font-bold tracking-tight">{user.full_name}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/usuarios/${user.id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          {!user.is_superadmin && (
            <FormWithToast 
              action={deleteUser} 
              successMessage="Usuário excluído com sucesso!"
              redirectTo="/admin/usuarios"
            >
              <input type="hidden" name="id" value={user.id} />
              <SubmitButton variant="destructive" loadingText="Excluindo...">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </SubmitButton>
            </FormWithToast>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações pessoais</CardTitle>
            <CardDescription>Dados básicos do usuário.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Nome</span>
              <span className="font-medium">{user.full_name}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            {profile.is_superadmin && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Empresa</span>
                  <span className="font-medium">{companyName ?? "Global"}</span>
                </div>
              </>
            )}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cargo</span>
              <span className="font-medium">{jobName ?? "Sem cargo"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Perfil e acesso</CardTitle>
            <CardDescription>Configurações de permissões.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Perfil</span>
              <Badge variant="secondary">{roleLabels[user.role] || user.role}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={user.is_active ? "success" : "destructive"}>
                {user.is_active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Superadmin</span>
              <Badge variant={user.is_superadmin ? "default" : "secondary"}>
                {user.is_superadmin ? "Sim" : "Não"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
            <CardDescription>Datas importantes do registro.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <span className="text-sm text-muted-foreground">Criado em</span>
                <span className="font-medium">
                  {new Date(user.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <span className="text-sm text-muted-foreground">Atualizado em</span>
                <span className="font-medium">
                  {new Date(user.updated_at).toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
