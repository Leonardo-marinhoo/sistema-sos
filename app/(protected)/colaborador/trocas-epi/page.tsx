import Link from "next/link";
import {
  CalendarClock,
  Camera,
  CheckCircle,
  Clock,
  ExternalLink,
  ImageIcon,
  RefreshCw,
  Send,
  Trash2,
  XCircle,
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
import { FormWithToast } from "@/components/ui/form-with-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select-new";
import { SubmitButton } from "@/components/ui/submit-button";
import { requirePermission, requireSession } from "@/lib/auth/session";
import {
  createExchangeRequest,
  deleteOwnPendingRequest,
} from "@/app/(protected)/colaborador/trocas-epi/actions";

type EpiOption = {
  id: string;
  code: string;
  name: string;
};

export default async function EmployeeExchangePage() {
  await requirePermission("epi-exchange-request");
  const { supabase, profile } = await requireSession();

  const { data: deliveries } = await supabase
    .from("epi_deliveries")
    .select("id")
    .eq("employee_user_id", profile.id)
    .order("delivered_at", { ascending: false });

  const deliveryIds = (deliveries ?? []).map((delivery) => delivery.id);

  const [{ data: deliveredItems }, { data: requests }] = await Promise.all([
    deliveryIds.length
      ? supabase
          .from("epi_delivery_items")
          .select("epi_id,expires_at,epis(id,code,name)")
          .in("delivery_id", deliveryIds)
          .order("expires_at", { ascending: true })
      : Promise.resolve({
          data: [] as Array<{
            epi_id: string;
            expires_at: string;
            epis: { id?: string; code?: string; name?: string } | null;
          }>,
        }),
    supabase
      .from("epi_exchange_requests")
      .select(
        "id,reason,status,evidence_photo_url,review_note,reviewed_by_user_id,reviewed_at,created_at,epis(id,name,code)"
      )
      .eq("employee_user_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  const epiMap = new Map<string, EpiOption>();
  for (const item of deliveredItems ?? []) {
    const epiRel = item.epis as
      | { id?: string; name?: string; code?: string }
      | Array<{ id?: string; name?: string; code?: string }>
      | null;
    const epi = Array.isArray(epiRel) ? epiRel[0] : epiRel;
    if (item.epi_id && epi?.name) {
      epiMap.set(item.epi_id, {
        id: item.epi_id,
        code: epi.code ?? "EPI",
        name: epi.name,
      });
    }
  }

  const epis = Array.from(epiMap.values()).sort((a, b) =>
    `${a.code} ${a.name}`.localeCompare(`${b.code} ${b.name}`),
  );

  const reviewerIds = Array.from(
    new Set((requests ?? []).map((request) => request.reviewed_by_user_id).filter(Boolean)),
  ) as string[];

  const { data: reviewers } = reviewerIds.length
    ? await supabase.from("app_users").select("id,full_name").in("id", reviewerIds)
    : { data: [] as Array<{ id: string; full_name: string }> };

  const reviewerMap = new Map((reviewers ?? []).map((reviewer) => [reviewer.id, reviewer.full_name]));

  const statusConfig: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "success" | "destructive";
      icon: React.ComponentType<{ className?: string }>;
    }
  > = {
    pending: { label: "Pendente", variant: "secondary", icon: Clock },
    approved: { label: "Aprovado", variant: "success", icon: CheckCircle },
    rejected: { label: "Rejeitado", variant: "destructive", icon: XCircle },
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Colaborador
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Trocas de EPI</h1>
        <p className="text-muted-foreground">
          Solicite substituição anexando uma foto tirada pelo celular ou enviada
          pelo computador.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Nova solicitação
            </CardTitle>
            <CardDescription>
              Selecione um EPI já entregue para você e anexe a evidência.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {epis.length ? (
              <FormWithToast
                action={createExchangeRequest}
                successMessage="Solicitação enviada com sucesso!"
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="epi_id">EPI</Label>
                  <Select name="epi_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o EPI" />
                    </SelectTrigger>
                    <SelectContent>
                      {epis.map((epi) => (
                        <SelectItem key={epi.id} value={epi.id}>
                          {epi.code} - {epi.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo da troca</Label>
                  <textarea
                    id="reason"
                    required
                    name="reason"
                    placeholder="Ex: bota rasgada, luva vencida, óculos arranhado..."
                    className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="evidence_photo">Foto do EPI</Label>
                  <div className="rounded-xl border border-dashed bg-muted/30 p-4">
                    <div className="mb-3 flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Camera className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">
                          Tire uma foto ou selecione um arquivo
                        </p>
                        <p className="text-xs leading-5 text-muted-foreground">
                          No celular, este campo permite abrir a câmera. No PC,
                          selecione uma imagem. Limite: 5MB.
                        </p>
                      </div>
                    </div>
                    <Input
                      id="evidence_photo"
                      required
                      type="file"
                      name="evidence_photo"
                      accept="image/*"
                      capture="environment"
                      className="cursor-pointer bg-background"
                    />
                  </div>
                </div>

                <SubmitButton className="w-full" loadingText="Enviando...">
                  <Send className="mr-2 h-4 w-4" />
                  Enviar solicitação
                </SubmitButton>
              </FormWithToast>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center">
                <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/60" />
                <h3 className="mt-3 font-semibold">Nenhum EPI entregue</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Você só pode solicitar troca de EPIs que já foram registrados
                  em uma entrega.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de solicitações</CardTitle>
            <CardDescription>
              Detalhes das trocas solicitadas e evidências anexadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requests?.length ? (
              <div className="space-y-4">
                {requests.map((request) => {
                  const epiRel = request.epis as
                    | { name?: string; code?: string }
                    | Array<{ name?: string; code?: string }>
                    | null;
                  const epi = Array.isArray(epiRel) ? epiRel[0] : epiRel;
                  const config = statusConfig[request.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  const reviewerName = request.reviewed_by_user_id
                    ? reviewerMap.get(request.reviewed_by_user_id)
                    : null;

                  return (
                    <div key={request.id} className="overflow-hidden rounded-xl border bg-card">
                      <div className="grid gap-4 p-4 md:grid-cols-[9rem_1fr]">
                        <a
                          href={request.evidence_photo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="group relative block h-36 overflow-hidden rounded-lg border bg-muted md:h-full"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={request.evidence_photo_url}
                            alt="Foto anexada na solicitação de troca"
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />
                          <span className="absolute bottom-2 right-2 rounded-full bg-black/70 p-1.5 text-white">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </span>
                        </a>

                        <div className="min-w-0 space-y-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="font-semibold">
                                {epi?.code ?? "EPI"} - {epi?.name ?? "Sem nome"}
                              </h3>
                              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                {request.reason}
                              </p>
                            </div>
                            <Badge variant={config.variant} className="shrink-0">
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {config.label}
                            </Badge>
                          </div>

                          <div className="grid gap-2 text-sm sm:grid-cols-2">
                            <div className="rounded-lg bg-muted/40 p-3">
                              <p className="text-xs text-muted-foreground">Solicitada em</p>
                              <p className="mt-1 font-medium">
                                {new Date(request.created_at).toLocaleString("pt-BR")}
                              </p>
                            </div>
                            <div className="rounded-lg bg-muted/40 p-3">
                              <p className="text-xs text-muted-foreground">Revisão</p>
                              <p className="mt-1 font-medium">
                                {request.reviewed_at
                                  ? `${new Date(request.reviewed_at).toLocaleString("pt-BR")}${
                                      reviewerName ? ` por ${reviewerName}` : ""
                                    }`
                                  : "Ainda não revisada"}
                              </p>
                              {request.review_note ? (
                                <p className="mt-2 text-sm leading-5 text-muted-foreground">
                                  {request.review_note}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <Separator />

                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                              <CalendarClock className="h-3.5 w-3.5" />
                              Solicitação #{request.id.slice(0, 8)}
                            </span>
                            {request.status === "pending" && (
                              <FormWithToast
                                action={deleteOwnPendingRequest}
                                successMessage="Solicitação cancelada!"
                              >
                                <input type="hidden" name="id" value={request.id} />
                                <SubmitButton
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  loadingText="Cancelando..."
                                >
                                  <Trash2 className="mr-1 h-4 w-4" />
                                  Cancelar
                                </SubmitButton>
                              </FormWithToast>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <RefreshCw className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-semibold">Nenhuma solicitação</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Você ainda não fez nenhuma solicitação de troca.
                </p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href="/colaborador/meus-epis">Ver meus EPIs</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
