import Link from "next/link";
import { ArrowRight, Building2, ShieldCheck, UsersRound, HardHat, AlertTriangle, Package } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { NAV_ITEMS, canAccessItem } from "@/lib/auth/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RoleOnboardingWizard } from "@/components/onboarding/role-onboarding-wizard";
import type { RoleOnboardingKey } from "@/lib/onboarding-content";

export default async function AdminDashboardPage() {
  const { profile, permissions, supabase } = await requireSession();

  const isSuperadmin = profile.is_superadmin;

  // Métricas baseadas no perfil
  const [
    { count: companiesCount },
    { count: usersCount },
    { count: episCount },
    { count: pendingExchangesCount },
  ] = await Promise.all([
    isSuperadmin
      ? supabase.from("companies").select("id", { head: true, count: "exact" })
      : Promise.resolve({ count: 1 }),
    isSuperadmin
      ? supabase.from("app_users").select("id", { head: true, count: "exact" })
      : supabase.from("app_users").select("id", { head: true, count: "exact" }).eq("company_id", profile.company_id),
    profile.company_id
      ? supabase.from("epis").select("id", { head: true, count: "exact" }).eq("company_id", profile.company_id)
      : Promise.resolve({ count: 0 }),
    profile.company_id
      ? supabase.from("epi_exchange_requests").select("id", { head: true, count: "exact" })
          .eq("company_id", profile.company_id)
          .eq("status", "pending")
      : Promise.resolve({ count: 0 }),
  ]);

  // Filtrar itens de navegação acessíveis
  const accessibleItems = NAV_ITEMS.filter(
    (item) => item.href !== "/admin" && canAccessItem(item, isSuperadmin, permissions, profile.role)
  );

  const roleLabels: Record<string, string> = {
    employee: "Colaborador",
    safety_technician: "Técnico de Segurança",
    company_admin: "Admin da Empresa",
    administrator: "Administrador",
  };

  const onboardingRole: RoleOnboardingKey = isSuperadmin
    ? "superadmin"
    : profile.role === "safety_technician"
      ? "safety_technician"
      : "company_admin";

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {isSuperadmin ? "Administração SaaS" : "Gestão da Empresa"}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Olá, {profile.full_name.split(" ")[0]}! 👋
        </h1>
        <p className="text-muted-foreground">
          {isSuperadmin
            ? "Gerencie todas as empresas e usuários do sistema."
            : "Gerencie os recursos da sua empresa."}
        </p>
      </div>

      <RoleOnboardingWizard roleKey={onboardingRole} />

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isSuperadmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Empresas
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Building2 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{companiesCount ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Empresas cadastradas
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isSuperadmin ? "Usuários Total" : "Colaboradores"}
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <UsersRound className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{usersCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isSuperadmin ? "Em todas as empresas" : "Na sua empresa"}
            </p>
          </CardContent>
        </Card>

        {!isSuperadmin && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  EPIs Cadastrados
                </CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                  <HardHat className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{episCount ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tipos de EPI
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Trocas Pendentes
                </CardTitle>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${(pendingExchangesCount ?? 0) > 0 ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-600"}`}>
                  <Package className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pendingExchangesCount ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Aguardando aprovação
                </p>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Seu Perfil
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {isSuperadmin ? "Superadmin" : roleLabels[profile.role] || profile.role}
            </div>
            <Badge variant={isSuperadmin ? "default" : "secondary"} className="mt-2">
              {isSuperadmin ? "Acesso Global" : "Acesso Empresa"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acesso rápido</CardTitle>
            <CardDescription>
              {isSuperadmin
                ? "Gerencie empresas e usuários do sistema."
                : "Acesse os módulos de gestão da empresa."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {accessibleItems.slice(0, 6).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center gap-4 rounded-lg border p-4 transition-all hover:bg-accent hover:border-primary/20"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.module === "Superadmin" ? "SaaS" : "Gestão"}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Alertas */}
          {!isSuperadmin && (pendingExchangesCount ?? 0) > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-4 w-4" />
                  Atenção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-700">
                  Existem <strong>{pendingExchangesCount}</strong> solicitações de troca de EPI aguardando aprovação.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Atalhos */}
          <Card>
            <CardHeader>
              <CardTitle>Atalhos</CardTitle>
              <CardDescription>Ações frequentes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {accessibleItems.slice(0, 3).map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    variant="outline"
                    className="w-full justify-between"
                    asChild
                  >
                    <Link href={item.href}>
                      <span className="inline-flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          {/* Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Seu acesso</CardTitle>
              <CardDescription>Resumo das suas permissões.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-sm text-muted-foreground">Perfil</span>
                <Badge variant="secondary">
                  {isSuperadmin ? "Superadmin" : roleLabels[profile.role] || profile.role}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-sm text-muted-foreground">Escopo</span>
                <Badge variant={isSuperadmin ? "default" : "outline"}>
                  {isSuperadmin ? "Global" : "Empresa"}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Permissões</span>
                <span className="text-sm font-medium">{permissions.length} ativas</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
