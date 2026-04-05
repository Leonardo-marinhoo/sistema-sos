import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireSession } from "@/lib/auth/session";
import {
  approveWorkPermit,
  cancelWorkPermit,
  updatePermitChecklist,
} from "@/app/(protected)/admin/permissoes-trabalho/actions";

function statusLabel(status: string, isExpiredByDate: boolean) {
  if (status === "cancelled") return "Cancelada";
  if (status === "expired" || isExpiredByDate) return "Expirada";
  if (status === "active") return "Ativa";
  return "Rascunho";
}

function statusVariant(status: string, isExpiredByDate: boolean) {
  if (status === "cancelled") return "destructive" as const;
  if (status === "expired" || isExpiredByDate) return "warning" as const;
  if (status === "active") return "success" as const;
  return "secondary" as const;
}

export default async function WorkPermitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile, permissions } = await requireSession();

  const canCreate = profile.is_superadmin || permissions.includes("pt-create");
  const canApprove = profile.is_superadmin || permissions.includes("pt-approve");

  if (!canCreate && !canApprove) {
    redirect("/dashboard");
  }

  let permitQuery = supabase
    .from("work_permits")
    .select(
      "id,company_id,activity_id,requested_by_user_id,approved_by_user_id,status,starts_at,expires_at,created_at"
    )
    .eq("id", id);

  if (!profile.is_superadmin && profile.company_id) {
    permitQuery = permitQuery.eq("company_id", profile.company_id);
  }

  const { data: permit } = await permitQuery.maybeSingle();
  if (!permit) notFound();

  const [{ data: checklistItems }, { data: activity }, { data: requester }, { data: approver }, { data: company }] =
    await Promise.all([
      supabase
        .from("work_permit_checklist_items")
        .select("id,item_text,is_checked")
        .eq("permit_id", permit.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("work_activities")
        .select("id,code,title,nr_reference")
        .eq("id", permit.activity_id)
        .maybeSingle(),
      supabase
        .from("app_users")
        .select("id,full_name")
        .eq("id", permit.requested_by_user_id)
        .maybeSingle(),
      permit.approved_by_user_id
        ? supabase
            .from("app_users")
            .select("id,full_name")
            .eq("id", permit.approved_by_user_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      profile.is_superadmin
        ? supabase.from("companies").select("id,name").eq("id", permit.company_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const checklist = checklistItems ?? [];
  const checkedCount = checklist.filter((item) => item.is_checked).length;
  const nowIso = new Date().toISOString();
  const isExpiredByDate = permit.expires_at < nowIso;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/permissoes-trabalho">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">Permissões de Trabalho</p>
          <h1 className="text-3xl font-black">{activity?.code ?? "PT"} - {activity?.title ?? "Detalhe"}</h1>
        </div>
      </div>

      <Card className="border-primary/15 bg-gradient-to-r from-white to-sky-50/60">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Painel de Aprovação Técnica</CardTitle>
              <CardDescription>
                A PT só pode ser ativada com checklist concluído e evidências de assinatura/foto.
              </CardDescription>
            </div>
            <Badge variant={statusVariant(permit.status, isExpiredByDate)}>
              {statusLabel(permit.status, isExpiredByDate)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Solicitante:</span> {requester?.full_name ?? "-"}
          </p>
          <p>
            <span className="text-muted-foreground">Aprovador:</span> {approver?.full_name ?? "Pendente"}
          </p>
          <p>
            <span className="text-muted-foreground">Início:</span> {new Date(permit.starts_at).toLocaleString("pt-BR")}
          </p>
          <p>
            <span className="text-muted-foreground">Vencimento:</span> {new Date(permit.expires_at).toLocaleString("pt-BR")}
          </p>
          {activity?.nr_reference && (
            <p>
              <span className="text-muted-foreground">NR:</span> {activity.nr_reference}
            </p>
          )}
          {profile.is_superadmin && company?.name && (
            <p>
              <span className="text-muted-foreground">Empresa:</span> {company.name}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Checklist de Segurança
            </CardTitle>
            <CardDescription>
              {checkedCount} de {checklist.length} itens concluídos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updatePermitChecklist} className="space-y-4">
              <input type="hidden" name="permit_id" value={permit.id} />

              {checklist.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem itens no checklist.</p>
              ) : (
                <div className="space-y-2">
                  {checklist.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border border-border/80 p-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="checked_item_ids"
                        value={item.id}
                        defaultChecked={item.is_checked}
                        disabled={!canCreate || permit.status !== "draft"}
                        className="h-4 w-4"
                      />
                      <span>{item.item_text}</span>
                    </label>
                  ))}
                </div>
              )}

              {canCreate && permit.status === "draft" && (
                <Button type="submit" variant="outline" className="w-full">
                  Salvar checklist
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Aprovação da PT
            </CardTitle>
            <CardDescription>
              Checklist 100% + evidências obrigatórias para ativação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {canApprove && permit.status === "draft" ? (
              <form action={approveWorkPermit} className="space-y-3">
                <input type="hidden" name="permit_id" value={permit.id} />

                <div className="space-y-2">
                  <Label htmlFor="employee_signature_url">Assinatura colaborador (URL)</Label>
                  <Input id="employee_signature_url" name="employee_signature_url" type="url" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="technician_signature_url">Assinatura técnico (URL)</Label>
                  <Input id="technician_signature_url" name="technician_signature_url" type="url" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee_photo_url">Foto colaborador (URL)</Label>
                  <Input id="employee_photo_url" name="employee_photo_url" type="url" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="technician_photo_url">Foto técnico (URL)</Label>
                  <Input id="technician_photo_url" name="technician_photo_url" type="url" required />
                </div>

                <Button type="submit" className="w-full">
                  Ativar PT
                </Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                {permit.status === "draft"
                  ? "Sem permissão para aprovar esta PT."
                  : "PT já saiu do estado de rascunho."}
              </p>
            )}

            {canApprove && (permit.status === "draft" || permit.status === "active") && (
              <form action={cancelWorkPermit}>
                <input type="hidden" name="permit_id" value={permit.id} />
                <Button type="submit" variant="destructive" className="w-full">
                  <XCircle className="h-4 w-4" />
                  Cancelar PT
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
