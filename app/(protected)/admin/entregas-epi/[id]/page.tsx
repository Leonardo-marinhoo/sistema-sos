import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requirePermission } from "@/lib/auth/session";
import { getAvatarSrc, getRoleAvatarFallback, getUserInitials } from "@/lib/avatar";

export default async function EpiDeliveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await requirePermission("epi-deliver");

  let deliveryQuery = supabase
    .from("epi_deliveries")
    .select(
      "id,company_id,employee_user_id,delivered_by_user_id,exchange_request_id,receiver_signature_data_url,deliverer_signature_data_url,signature_file_url,photo_file_url,delivered_at,created_at"
    )
    .eq("id", id);

  if (!profile.is_superadmin && profile.company_id) {
    deliveryQuery = deliveryQuery.eq("company_id", profile.company_id);
  }

  const { data: delivery } = await deliveryQuery.maybeSingle();
  if (!delivery) notFound();

  const [{ data: employee }, { data: deliverer }, { data: items }, { data: company }, { data: exchangeRequest }] = await Promise.all([
    supabase.from("app_users").select("id,full_name,role,photo_url").eq("id", delivery.employee_user_id).maybeSingle(),
    supabase.from("app_users").select("id,full_name,role,photo_url").eq("id", delivery.delivered_by_user_id).maybeSingle(),
    supabase
      .from("epi_delivery_items")
      .select("id,epi_id,quantity,expires_at,epis(code,name)")
      .eq("delivery_id", delivery.id)
      .order("expires_at", { ascending: true }),
    profile.is_superadmin
      ? supabase.from("companies").select("id,name").eq("id", delivery.company_id).maybeSingle()
      : Promise.resolve({ data: null }),
    delivery.exchange_request_id
      ? supabase
          .from("epi_exchange_requests")
          .select("id,reason,status,review_note,evidence_photo_url,created_at,epis(code,name)")
          .eq("id", delivery.exchange_request_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/entregas-epi">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Entregas de EPI</p>
            <h1 className="text-3xl font-bold tracking-tight">Detalhe da entrega</h1>
          </div>
        </div>
        <Badge variant="outline">ID: {delivery.id.slice(0, 8)}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
            <CardDescription>Informacoes principais da entrega registrada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
              <UserAvatar
                className="h-14 w-14 border border-border/50 shadow-sm"
                variant="square"
                src={getAvatarSrc(employee?.photo_url, employee?.role)}
                fallbackSrc={getRoleAvatarFallback(employee?.role)}
                alt={employee?.full_name ?? "Colaborador"}
                initials={getUserInitials(employee?.full_name ?? "ND")}
                fallbackClassName="text-lg font-bold"
              />
              <div>
                <p className="text-xs text-muted-foreground">Colaborador</p>
                <p className="font-semibold">{employee?.full_name ?? "-"}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
              <UserAvatar
                className="h-14 w-14 border border-border/50 shadow-sm"
                variant="square"
                src={getAvatarSrc(deliverer?.photo_url, deliverer?.role)}
                fallbackSrc={getRoleAvatarFallback(deliverer?.role)}
                alt={deliverer?.full_name ?? "Entregador"}
                initials={getUserInitials(deliverer?.full_name ?? "ND")}
                fallbackClassName="text-lg font-bold"
              />
              <div>
                <p className="text-xs text-muted-foreground">Responsável pela troca</p>
                <p className="font-semibold">{deliverer?.full_name ?? "-"}</p>
              </div>
            </div>

            <Separator />
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Data da entrega</span>
              <span className="font-medium text-right">
                {new Date(delivery.delivered_at).toLocaleString("pt-BR")}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Registro</span>
              <span className="font-medium text-right">
                {new Date(delivery.created_at).toLocaleString("pt-BR")}
              </span>
            </div>
            {profile.is_superadmin && (
              <>
                <Separator />
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Empresa</span>
                  <span className="font-medium text-right">{company?.name ?? "-"}</span>
                </div>
              </>
            )}
            <Separator />
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Solicitação de troca</span>
              <span className="font-medium text-right">
                {delivery.exchange_request_id ? `#${delivery.exchange_request_id.slice(0, 8)}` : "Não vinculada"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assinaturas</CardTitle>
            <CardDescription>Evidencias coletadas no momento da entrega.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Colaborador</p>
              {delivery.receiver_signature_data_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={delivery.receiver_signature_data_url}
                  alt="Assinatura do colaborador"
                  className="h-40 w-full rounded-md border border-border/80 bg-emerald-50/60 object-contain p-2"
                />
              ) : (
                <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
                  Assinatura do colaborador nao encontrada.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Entregador</p>
              {delivery.deliverer_signature_data_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={delivery.deliverer_signature_data_url}
                  alt="Assinatura do entregador"
                  className="h-40 w-full rounded-md border border-border/80 bg-emerald-50/60 object-contain p-2"
                />
              ) : (
                <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
                  Assinatura do responsável pela troca nao encontrada.
                </p>
              )}
            </div>

            {(delivery.signature_file_url || delivery.photo_file_url) && (
              <div className="rounded-md border border-border/80 bg-muted/30 p-3 text-xs text-muted-foreground">
                Este registro possui evidencias legadas por URL.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {exchangeRequest ? (
        <Card>
          <CardHeader>
            <CardTitle>Solicitação de troca vinculada</CardTitle>
            <CardDescription>
              Esta entrega foi registrada como atendimento de uma solicitação aprovada.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[10rem_1fr]">
            <a
              href={exchangeRequest.evidence_photo_url}
              target="_blank"
              rel="noreferrer"
              className="block h-40 overflow-hidden rounded-md border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={exchangeRequest.evidence_photo_url}
                alt="Evidência da solicitação de troca"
                className="h-full w-full object-cover"
              />
            </a>
            <div className="space-y-3 text-sm">
              {(() => {
                const epiRel = exchangeRequest.epis as { code?: string; name?: string } | Array<{ code?: string; name?: string }> | null;
                const epi = Array.isArray(epiRel) ? epiRel[0] : epiRel;

                return (
                  <div>
                    <p className="font-semibold">
                      {epi?.code ?? "EPI"} - {epi?.name ?? "Sem nome"}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Solicitada em {new Date(exchangeRequest.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                );
              })()}
              <Separator />
              <p>
                <span className="font-medium">Motivo:</span> {exchangeRequest.reason}
              </p>
              {exchangeRequest.review_note ? (
                <p>
                  <span className="font-medium">Resposta:</span> {exchangeRequest.review_note}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Itens Entregues</CardTitle>
          <CardDescription>Lista de EPIs registrados nesta entrega.</CardDescription>
        </CardHeader>
        <CardContent>
          {!items?.length ? (
            <p className="text-sm text-muted-foreground">Nenhum item encontrado para esta entrega.</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const epiRel = item.epis as { code?: string; name?: string } | Array<{ code?: string; name?: string }> | null;
                const epiData = Array.isArray(epiRel) ? epiRel[0] : epiRel;

                return (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/80 p-3 text-sm">
                    <div>
                      <p className="font-medium">{epiData?.code ?? "EPI"} - {epiData?.name ?? "Sem nome"}</p>
                      <p className="text-muted-foreground">Quantidade: {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Validade: {new Date(`${item.expires_at}T00:00:00`).toLocaleDateString("pt-BR")}
                      </span>
                      <Badge variant="secondary">Controle de validade</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
