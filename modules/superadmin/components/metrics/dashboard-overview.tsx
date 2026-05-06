"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getMetricsOverview } from "@/modules/superadmin/lib/api";
import {
  BarChart3,
  Users,
  LogIn,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

interface MetricsData {
  today: {
    logins: number;
    actions: number;
    activeUsers: number;
  };
  weekly: {
    activeUsers: number;
  };
  overall: {
    totalUsers: number;
    inactiveUsers: number;
  };
}

export function MetricsDashboardOverview() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getMetricsOverview();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar métricas");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-20" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-2 pt-6">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-600">{error || "Erro ao carregar métricas"}</p>
        </CardContent>
      </Card>
    );
  }

  const cards = [
    {
      title: "Logins Hoje",
      value: metrics.today.logins,
      icon: LogIn,
      color: "blue",
    },
    {
      title: "Ações Hoje",
      value: metrics.today.actions,
      icon: BarChart3,
      color: "green",
    },
    {
      title: "Usuários Ativos (7 dias)",
      value: metrics.weekly.activeUsers,
      icon: Users,
      color: "purple",
    },
    {
      title: "Usuários Inativos (30 dias)",
      value: metrics.overall.inactiveUsers,
      icon: AlertCircle,
      color: "orange",
    },
  ];

  const colorClasses = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700",
    orange: "bg-orange-50 text-orange-700",
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const colorClass = colorClasses[card.color as keyof typeof colorClasses];

        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${colorClass}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.title === "Usuários Inativos (30 dias)" && "sem atividade"}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
