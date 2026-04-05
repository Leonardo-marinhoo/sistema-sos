import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requirePermission } from "@/lib/auth/session";

export default async function EpiDeliveriesPage() {
  const { supabase, profile } = await requirePermission("epi-deliver");

  let deliveriesQuery = supabase
    .from("epi_deliveries")
    .select("id,company_id,employee_user_id,delivered_by_user_id,delivered_at,created_at")
    .order("created_at", { ascending: false });

  if (!profile.is_superadmin && profile.company_id) {
    deliveriesQuery = deliveriesQuery.eq("company_id", profile.company_id);
  }

  const { data: deliveriesData, error } = await deliveriesQuery;

  if (error) {
    console.error("Erro ao listar entregas de EPI:", error);
  }

  const deliveries = deliveriesData ?? [];
  const deliveryIds = deliveries.map((delivery) => delivery.id);
  const userIds = Array.from(
    new Set(deliveries.flatMap((delivery) => [delivery.employee_user_id, delivery.delivered_by_user_id]))
  );
  const companyIds = Array.from(new Set(deliveries.map((delivery) => delivery.company_id).filter(Boolean)));

  const [{ data: usersData }, { data: itemsData }, { data: companiesData }] = await Promise.all([
    userIds.length
      ? supabase.from("app_users").select("id,full_name").in("id", userIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string }> }),
    deliveryIds.length
      ? supabase.from("epi_delivery_items").select("delivery_id,quantity").in("delivery_id", deliveryIds)
      : Promise.resolve({ data: [] as Array<{ delivery_id: string; quantity: number }> }),
    profile.is_superadmin && companyIds.length
      ? supabase.from("companies").select("id,name").in("id", companyIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
  ]);

  const userMap = new Map((usersData ?? []).map((user) => [user.id, user.full_name]));
  const companyMap = new Map((companiesData ?? []).map((company) => [company.id, company.name]));

  const itemCountMap = new Map<string, { itemCount: number; totalQuantity: number }>();
  for (const item of itemsData ?? []) {
    const current = itemCountMap.get(item.delivery_id) ?? { itemCount: 0, totalQuantity: 0 };
    itemCountMap.set(item.delivery_id, {
      itemCount: current.itemCount + 1,
      totalQuantity: current.totalQuantity + item.quantity,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-primary/20 bg-gradient-to-br from-emerald-50/70 via-white to-sky-50/60">
        <CardHeader>
          <CardTitle className="text-3xl font-black">Entregas de EPI</CardTitle>
          <CardDescription>
            Registre entregas com lembrete de kit por cargo e rastreabilidade operacional.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href="/admin/entregas-epi/novo">
              <Plus className="h-4 w-4" />
              Nova entrega
            </Link>
          </Button>
          <div className="ml-auto">
            <Badge variant="secondary">Total: {deliveries.length}</Badge>
          </div>
        </CardContent>
      </Card>

      {deliveries.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center text-sm text-muted-foreground">
            Nenhuma entrega registrada ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {deliveries.map((delivery) => {
            const itemStats = itemCountMap.get(delivery.id) ?? { itemCount: 0, totalQuantity: 0 };
            return (
              <Card key={delivery.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl">Entrega #{delivery.id.slice(0, 8)}</CardTitle>
                      <CardDescription className="mt-1">
                        Colaborador: {userMap.get(delivery.employee_user_id) ?? "Nao identificado"}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{itemStats.itemCount} itens</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>
                    <span className="text-muted-foreground">Entregador:</span>{" "}
                    {userMap.get(delivery.delivered_by_user_id) ?? "Nao identificado"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Quantidade total:</span> {itemStats.totalQuantity}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Data:</span>{" "}
                    {new Date(delivery.delivered_at).toLocaleString("pt-BR")}
                  </p>
                  {profile.is_superadmin && (
                    <p>
                      <span className="text-muted-foreground">Empresa:</span>{" "}
                      {companyMap.get(delivery.company_id) ?? "-"}
                    </p>
                  )}

                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/admin/entregas-epi/${delivery.id}`}>Ver detalhes</Link>
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
