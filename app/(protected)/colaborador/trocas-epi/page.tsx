import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select-new";
import { FormWithToast } from "@/components/ui/form-with-toast";
import { SubmitButton } from "@/components/ui/submit-button";
import { requirePermission, requireSession } from "@/lib/auth/session";
import { createExchangeRequest, deleteOwnPendingRequest } from "@/app/(protected)/colaborador/trocas-epi/actions";
import { RefreshCw, Trash2, Clock, CheckCircle, XCircle, Send } from "lucide-react";

export default async function EmployeeExchangePage() {
  await requirePermission("epi-exchange-request");
  const { supabase, profile } = await requireSession();

  const [{ data: epis }, { data: requests }] = await Promise.all([
    supabase
      .from("epis")
      .select("id,name,code")
      .eq("company_id", profile.company_id)
      .order("name", { ascending: true }),
    supabase
      .from("epi_exchange_requests")
      .select("id,reason,status,created_at,epis(name,code)")
      .eq("employee_user_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "success" | "destructive"; icon: React.ComponentType<{ className?: string }> }> = {
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
          Solicite a troca de equipamentos de proteção individual.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Nova solicitação
            </CardTitle>
            <CardDescription>
              Preencha os dados para solicitar a troca de um EPI.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                    {epis?.map((epi) => (
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
                  placeholder="Descreva o motivo da troca..."
                  className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evidence_photo_url">URL da foto de evidência</Label>
                <Input
                  id="evidence_photo_url"
                  required
                  type="url"
                  name="evidence_photo_url"
                  placeholder="https://..."
                />
              </div>
              <SubmitButton className="w-full" loadingText="Enviando...">
                <Send className="mr-2 h-4 w-4" />
                Enviar solicitação
              </SubmitButton>
            </FormWithToast>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Minhas solicitações</CardTitle>
            <CardDescription>
              Histórico de solicitações de troca.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requests?.length ? (
              <div className="space-y-4">
                {requests.map((request) => {
                  const epiRel = request.epis as { name?: string; code?: string } | Array<{ name?: string; code?: string }> | null;
                  const epi = Array.isArray(epiRel) ? epiRel[0] : epiRel;
                  const config = statusConfig[request.status] || statusConfig.pending;
                  const StatusIcon = config.icon;

                  return (
                    <div key={request.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="font-semibold">
                            {epi?.code} - {epi?.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {request.reason}
                          </p>
                        </div>
                        <Badge variant={config.variant} className="shrink-0">
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {config.label}
                        </Badge>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
