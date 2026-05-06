import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  HardHat,
  PackageCheck,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireSession } from "@/lib/auth/session";

type DeliveryRow = {
  id: string;
  delivered_by_user_id: string;
  delivered_at: string;
  created_at: string;
};

type DeliveryItemRow = {
  id: string;
  delivery_id: string;
  epi_id: string;
  quantity: number;
  expires_at: string;
  epis:
    | { code?: string; name?: string; description?: string | null }
    | Array<{ code?: string; name?: string; description?: string | null }>
    | null;
};

function getExpiryStatus(expiresAt: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(`${expiresAt}T00:00:00`);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: "Vencido",
      variant: "destructive" as const,
      icon: AlertTriangle,
      tone: "border-red-200 bg-red-50",
    };
  }

  if (diffDays <= 30) {
    return {
      label: "A vencer",
      variant: "warning" as const,
      icon: AlertTriangle,
      tone: "border-amber-200 bg-amber-50",
    };
  }

  return {
    label: "Em dia",
    variant: "success" as const,
    icon: CheckCircle2,
    tone: "border-emerald-200 bg-emerald-50",
  };
}

export default async function MyEpisPage() {
  const { supabase, profile } = await requireSession();

  const { data: deliveriesData } = await supabase
    .from("epi_deliveries")
    .select("id,delivered_by_user_id,delivered_at,created_at")
    .eq("employee_user_id", profile.id)
    .order("delivered_at", { ascending: false });

  const deliveries = (deliveriesData ?? []) as DeliveryRow[];
  const deliveryIds = deliveries.map((delivery) => delivery.id);
  const delivererIds = Array.from(new Set(deliveries.map((delivery) => delivery.delivered_by_user_id)));

  const [{ data: itemsData }, { data: deliverersData }] = await Promise.all([
    deliveryIds.length
      ? supabase
          .from("epi_delivery_items")
          .select("id,delivery_id,epi_id,quantity,expires_at,epis(code,name,description)")
          .in("delivery_id", deliveryIds)
          .order("expires_at", { ascending: true })
      : Promise.resolve({ data: [] as DeliveryItemRow[] }),
    delivererIds.length
      ? supabase.from("app_users").select("id,full_name").in("id", delivererIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string }> }),
  ]);

  const items = (itemsData ?? []) as DeliveryItemRow[];
  const deliveryMap = new Map(deliveries.map((delivery) => [delivery.id, delivery]));
  const delivererMap = new Map((deliverersData ?? []).map((user) => [user.id, user.full_name]));

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const expiredCount = items.filter((item) => getExpiryStatus(item.expires_at).label === "Vencido").length;
  const expiringCount = items.filter((item) => getExpiryStatus(item.expires_at).label === "A vencer").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Colaborador
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Meus EPIs</h1>
          <p className="text-muted-foreground">
            Consulte os equipamentos entregues, validade e histórico de entrega.
          </p>
        </div>
        <Button asChild>
          <Link href="/colaborador/trocas-epi">
            <RefreshCw className="h-4 w-4" />
            Solicitar troca
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Itens recebidos
            </CardTitle>
            <HardHat className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{items.length}</div>
            <p className="text-xs text-muted-foreground">Tipos registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quantidade total
            </CardTitle>
            <PackageCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{totalQuantity}</div>
            <p className="text-xs text-muted-foreground">Unidades entregues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Atenção
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">{expiredCount + expiringCount}</div>
            <p className="text-xs text-muted-foreground">Vencidos ou a vencer</p>
          </CardContent>
        </Card>
      </div>

      {!items.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <HardHat className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-semibold">Nenhum EPI registrado</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Quando a empresa registrar uma entrega para você, os equipamentos
              aparecerão nesta página.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => {
            const epiRel = item.epis;
            const epi = Array.isArray(epiRel) ? epiRel[0] : epiRel;
            const delivery = deliveryMap.get(item.delivery_id);
            const status = getExpiryStatus(item.expires_at);
            const StatusIcon = status.icon;

            return (
              <Card key={item.id} className={status.tone}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl">
                        {epi?.code ?? "EPI"} - {epi?.name ?? "Sem nome"}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {epi?.description || "Equipamento de proteção individual"}
                      </CardDescription>
                    </div>
                    <Badge variant={status.variant}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-white/70 p-3">
                      <p className="text-xs text-muted-foreground">Quantidade</p>
                      <p className="mt-1 font-semibold">{item.quantity}</p>
                    </div>
                    <div className="rounded-lg border bg-white/70 p-3">
                      <p className="text-xs text-muted-foreground">Validade</p>
                      <p className="mt-1 font-semibold">
                        {new Date(`${item.expires_at}T00:00:00`).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      Entregue em{" "}
                      <span className="font-medium text-foreground">
                        {delivery
                          ? new Date(delivery.delivered_at).toLocaleString("pt-BR")
                          : "-"}
                      </span>
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <UserCheck className="h-4 w-4" />
                      Responsável{" "}
                      <span className="font-medium text-foreground">
                        {delivery ? delivererMap.get(delivery.delivered_by_user_id) ?? "-" : "-"}
                      </span>
                    </p>
                  </div>

                  <Button asChild variant="outline" className="w-full bg-white/80">
                    <Link href="/colaborador/trocas-epi">
                      Solicitar troca deste EPI
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
