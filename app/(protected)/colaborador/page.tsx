import Link from "next/link";
import { ArrowRight, HardHat, Bell, RefreshCw, ClipboardList, AlertTriangle, CheckCircle } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function ColaboradorDashboardPage() {
  const { profile, supabase } = await requireSession();
  const nowIso = new Date().toISOString();
  const expiresAtUpperBound = new Date(new Date(nowIso).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Buscar métricas do colaborador
  const [
    { count: myEpisCount },
    { count: pendingRequestsCount },
    { count: unreadNotificationsCount },
    { data: expiringEpis },
  ] = await Promise.all([
    supabase
      .from("epi_deliveries")
      .select("id", { head: true, count: "exact" })
      .eq("employee_user_id", profile.id)
      .eq("status", "active"),
    supabase
      .from("epi_exchange_requests")
      .select("id", { head: true, count: "exact" })
      .eq("employee_user_id", profile.id)
      .eq("status", "pending"),
    supabase
      .from("notifications")
      .select("id", { head: true, count: "exact" })
      .eq("recipient_user_id", profile.id)
      .eq("is_read", false),
    // EPIs próximos do vencimento (30 dias)
    supabase
      .from("epi_deliveries")
      .select("id, expires_at, epis(name)")
      .eq("employee_user_id", profile.id)
      .eq("status", "active")
      .gte("expires_at", nowIso)
      .lte("expires_at", expiresAtUpperBound)
      .limit(5),
  ]);

  const quickActions = [
    {
      href: "/colaborador/meus-epis",
      icon: HardHat,
      label: "Meus EPIs",
      description: "Ver equipamentos de proteção",
      badge: myEpisCount ?? 0,
    },
    {
      href: "/colaborador/trocas-epi",
      icon: RefreshCw,
      label: "Solicitar Troca",
      description: "Nova solicitação de troca de EPI",
      badge: pendingRequestsCount ?? 0,
    },
    {
      href: "/colaborador/notificacoes",
      icon: Bell,
      label: "Notificações",
      description: "Ver avisos e alertas",
      badge: unreadNotificationsCount ?? 0,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">Área do Colaborador</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Olá, {profile.full_name.split(" ")[0]}! 👋
        </h1>
        <p className="text-muted-foreground">
          Gerencie seus EPIs, acompanhe solicitações e veja suas notificações.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Meus EPIs
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <HardHat className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{myEpisCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Equipamentos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Solicitações
            </CardTitle>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${(pendingRequestsCount ?? 0) > 0 ? "bg-yellow-100 text-yellow-600" : "bg-green-100 text-green-600"}`}>
              {(pendingRequestsCount ?? 0) > 0 ? <RefreshCw className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingRequestsCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Notificações
            </CardTitle>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${(unreadNotificationsCount ?? 0) > 0 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}>
              <Bell className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{unreadNotificationsCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Não lidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              A Vencer
            </CardTitle>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${(expiringEpis?.length ?? 0) > 0 ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"}`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{expiringEpis?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Próximos 30 dias
            </p>
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
              Principais funcionalidades da área do colaborador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-center gap-4 rounded-lg border p-4 transition-all hover:bg-accent hover:border-primary/20"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{action.label}</p>
                        {action.badge > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Alertas de EPIs */}
          {(expiringEpis?.length ?? 0) > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-4 w-4" />
                  EPIs a Vencer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {expiringEpis?.slice(0, 3).map((epi) => {
                  const epiRel = epi.epis as { name?: string } | Array<{ name?: string }> | null;
                  const epiName = Array.isArray(epiRel) ? epiRel[0]?.name : epiRel?.name;

                  return (
                    <div key={epi.id} className="flex items-center justify-between text-sm">
                      <span className="text-orange-800">{epiName ?? "EPI"}</span>
                      <Badge variant="outline" className="text-orange-700 border-orange-300">
                        {new Date(epi.expires_at).toLocaleDateString("pt-BR")}
                      </Badge>
                    </div>
                  );
                })}
                <Separator className="my-2" />
                <Button variant="ghost" className="w-full text-orange-700" asChild>
                  <Link href="/colaborador/meus-epis">Ver todos</Link>
                </Button>
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
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/colaborador/trocas-epi/nova">
                  <span className="inline-flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Nova solicitação de troca
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/colaborador/meus-epis">
                  <span className="inline-flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Histórico de EPIs
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Perfil */}
          <Card>
            <CardHeader>
              <CardTitle>Seu perfil</CardTitle>
              <CardDescription>Informações da sua conta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-sm text-muted-foreground">Nome</span>
                <span className="text-sm font-medium">{profile.full_name}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-sm text-muted-foreground">Tipo</span>
                <Badge variant="secondary">Colaborador</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
