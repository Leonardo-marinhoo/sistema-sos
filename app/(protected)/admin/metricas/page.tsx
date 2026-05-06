import { requireSuperAdmin } from "@/lib/auth/session";
import { MetricsDashboardOverview } from "@/modules/superadmin/components/metrics/dashboard-overview";
import { AccessLogsTable } from "@/modules/superadmin/components/metrics/access-logs";
import { ActionLogsTable } from "@/modules/superadmin/components/metrics/action-logs";
import { UserActivityTable } from "@/modules/superadmin/components/metrics/user-activity";
import { PageAccessStats } from "@/modules/superadmin/components/metrics/page-access-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Métricas do Sistema",
  description: "Monitoramento de atividades e métricas do sistema",
};

export default async function MetricsPage() {
  const { profile } = await requireSuperAdmin();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Métricas do Sistema</h1>
        <p className="text-muted-foreground">
          Monitoramento de atividade do SaaS para {profile.full_name}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Resumo Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <MetricsDashboardOverview />
        </CardContent>
      </Card>

      <Separator />

      <div className="space-y-6">
        <section className="space-y-4">
          <PageAccessStats />
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Log de Acessos</h2>
            <p className="text-sm text-muted-foreground">
              Entradas, saídas e sessões do sistema.
            </p>
          </div>
          <AccessLogsTable />
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Log de Ações</h2>
            <p className="text-sm text-muted-foreground">
              Histórico de operações realizadas pelos usuários.
            </p>
          </div>
          <ActionLogsTable />
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Atividade de Usuários</h2>
            <p className="text-sm text-muted-foreground">
              Resumo de atividade e inatividade por usuário.
            </p>
          </div>
          <UserActivityTable />
        </section>
      </div>
    </div>
  );
}
