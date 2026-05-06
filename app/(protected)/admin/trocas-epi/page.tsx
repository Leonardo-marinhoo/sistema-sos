import {
  CalendarClock,
  CheckCircle,
  ExternalLink,
  FileText,
  RefreshCw,
  UserRound,
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SubmitButton } from "@/components/ui/submit-button";
import { requirePermission } from "@/lib/auth/session";
import { reviewExchangeRequest } from "@/app/(protected)/admin/trocas-epi/actions";

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "success" | "destructive";
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: { label: "Pendente", variant: "secondary", icon: RefreshCw },
  approved: { label: "Aprovada", variant: "success", icon: CheckCircle },
  rejected: { label: "Recusada", variant: "destructive", icon: XCircle },
};

export default async function AdminExchangeRequestsPage() {
  const { supabase, profile } = await requirePermission("epi-exchange-review");

  let query = supabase
    .from("epi_exchange_requests")
    .select(
      "id,company_id,employee_user_id,epi_id,reason,evidence_photo_url,status,review_note,reviewed_by_user_id,reviewed_at,created_at,epis(code,name)"
    )
    .order("created_at", { ascending: false });

  if (!profile.is_superadmin && profile.company_id) {
    query = query.eq("company_id", profile.company_id);
  }

  const { data: requestsData } = await query;
  const requests = requestsData ?? [];
  const requestIds = requests.map((request) => request.id);
  const userIds = Array.from(
    new Set(
      requests
        .flatMap((request) => [request.employee_user_id, request.reviewed_by_user_id])
        .filter(Boolean),
    ),
  ) as string[];

  const [{ data: users }, { data: linkedDeliveries }] = await Promise.all([
    userIds.length
      ? supabase.from("app_users").select("id,full_name,email").in("id", userIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string; email: string }> }),
    requestIds.length
      ? supabase
          .from("epi_deliveries")
          .select("id,exchange_request_id,delivered_at")
          .in("exchange_request_id", requestIds)
      : Promise.resolve({
          data: [] as Array<{
            id: string;
            exchange_request_id: string | null;
            delivered_at: string;
          }>,
        }),
  ]);

  const userMap = new Map((users ?? []).map((user) => [user.id, user]));
  const deliveryMap = new Map(
    (linkedDeliveries ?? [])
      .filter((delivery) => delivery.exchange_request_id)
      .map((delivery) => [delivery.exchange_request_id, delivery]),
  );

  const pendingCount = requests.filter((request) => request.status === "pending").length;

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-primary/20 bg-gradient-to-br from-emerald-50/70 via-white to-sky-50/60">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-3xl font-black">
                Solicitações de troca
              </CardTitle>
              <CardDescription className="mt-2">
                Analise pedidos dos colaboradores. Solicitações aprovadas podem
                ser vinculadas em uma nova entrega de EPI.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="w-fit">
              {pendingCount} pendentes
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <RefreshCw className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-semibold">Nenhuma solicitação</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Quando colaboradores pedirem troca, os registros aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {requests.map((request) => {
            const epiRel = request.epis as
              | { code?: string; name?: string }
              | Array<{ code?: string; name?: string }>
              | null;
            const epi = Array.isArray(epiRel) ? epiRel[0] : epiRel;
            const employee = userMap.get(request.employee_user_id);
            const reviewer = request.reviewed_by_user_id
              ? userMap.get(request.reviewed_by_user_id)
              : null;
            const linkedDelivery = deliveryMap.get(request.id);
            const config = statusConfig[request.status] ?? statusConfig.pending;
            const StatusIcon = config.icon;

            return (
              <Card key={request.id} className="overflow-hidden">
                <div className="grid gap-0 md:grid-cols-[11rem_1fr]">
                  <a
                    href={request.evidence_photo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative block h-48 overflow-hidden bg-muted md:h-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={request.evidence_photo_url}
                      alt="Evidência da solicitação de troca"
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                    <span className="absolute bottom-2 right-2 rounded-full bg-black/70 p-1.5 text-white">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </span>
                  </a>

                  <div>
                    <CardHeader>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-xl">
                            {epi?.code ?? "EPI"} - {epi?.name ?? "Sem nome"}
                          </CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-2">
                            <UserRound className="h-4 w-4" />
                            {employee?.full_name ?? "Colaborador não identificado"}
                          </CardDescription>
                        </div>
                        <Badge variant={config.variant}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {config.label}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="rounded-lg bg-muted/40 p-3">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Motivo do colaborador
                        </p>
                        <p className="mt-2 text-sm leading-6">{request.reason}</p>
                      </div>

                      <div className="grid gap-2 text-sm sm:grid-cols-2">
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Criada em</p>
                          <p className="mt-1 font-medium">
                            {new Date(request.created_at).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="text-xs text-muted-foreground">Entrega vinculada</p>
                          {linkedDelivery ? (
                            <p className="mt-1 font-medium">
                              #{linkedDelivery.id.slice(0, 8)}
                            </p>
                          ) : (
                            <p className="mt-1 font-medium">Nenhuma</p>
                          )}
                        </div>
                      </div>

                      {request.reviewed_at ? (
                        <div className="rounded-lg border bg-emerald-50/60 p-3 text-sm">
                          <p className="flex items-center gap-2 font-semibold">
                            <CalendarClock className="h-4 w-4" />
                            Respondida em{" "}
                            {new Date(request.reviewed_at).toLocaleString("pt-BR")}
                          </p>
                          <p className="mt-1 text-muted-foreground">
                            Por {reviewer?.full_name ?? "responsável não identificado"}
                          </p>
                          {request.review_note && (
                            <p className="mt-3 leading-6">{request.review_note}</p>
                          )}
                        </div>
                      ) : null}

                      {request.status === "pending" ? (
                        <>
                          <Separator />
                          <FormWithToast
                            action={reviewExchangeRequest}
                            successMessage="Solicitação respondida"
                            className="space-y-3"
                          >
                            <input type="hidden" name="id" value={request.id} />
                            <div className="space-y-2">
                              <Label htmlFor={`review-note-${request.id}`}>
                                Resposta ao colaborador
                              </Label>
                              <textarea
                                id={`review-note-${request.id}`}
                                name="review_note"
                                required
                                placeholder="Explique o motivo da aprovação ou recusa..."
                                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <SubmitButton name="status" value="approved" loadingText="Aprovando...">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Aprovar
                              </SubmitButton>
                              <SubmitButton
                                name="status"
                                value="rejected"
                                variant="destructive"
                                loadingText="Recusando..."
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Recusar
                              </SubmitButton>
                            </div>
                          </FormWithToast>
                        </>
                      ) : linkedDelivery ? (
                        <Button asChild variant="outline" className="w-full">
                          <a href={`/admin/entregas-epi/${linkedDelivery.id}`}>
                            <FileText className="h-4 w-4" />
                            Ver entrega vinculada
                          </a>
                        </Button>
                      ) : null}
                    </CardContent>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
