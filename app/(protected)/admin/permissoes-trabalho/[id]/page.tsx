import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { getAvatarSrc, getRoleAvatarFallback, getUserInitials } from "@/lib/avatar";
import {
  approveWorkPermit,
  cancelWorkPermit,
  updatePermitChecklist,
} from "@/app/(protected)/admin/permissoes-trabalho/actions";
import { PermitApprovalForm } from "@/app/(protected)/admin/permissoes-trabalho/[id]/permit-approval-form";

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

type PermitUser = {
  full_name: string;
  role: string;
  photo_url?: string | null;
};

function UserLine({
  label,
  user,
  pendingLabel,
  large = false,
}: {
  label: string;
  user: PermitUser | null;
  pendingLabel: string;
  large?: boolean;
}) {
  if (!user) {
    return (
      <div className={large ? "flex items-center gap-4 rounded-lg border bg-muted/30 p-4" : "flex items-center justify-between gap-3"}>
        {large ? (
          <>
            <div className="h-12 w-12 rounded-xl border border-dashed border-border/50 bg-muted/50 flex items-center justify-center text-muted-foreground text-xs">?</div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-semibold text-muted-foreground">{pendingLabel}</p>
            </div>
          </>
        ) : (
          <>
            <span className="text-muted-foreground">{label}:</span>
            <span>{pendingLabel}</span>
          </>
        )}
      </div>
    );
  }

  if (large) {
    return (
      <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
        <UserAvatar
          className="h-12 w-12 border border-border/50 shadow-sm"
          variant="square"
          src={getAvatarSrc(user.photo_url, user.role)}
          fallbackSrc={getRoleAvatarFallback(user.role)}
          alt={user.full_name}
          initials={getUserInitials(user.full_name)}
          fallbackClassName="text-base font-bold"
        />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-semibold">{user.full_name}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}:</span>
      <div className="flex items-center gap-2">
        <UserAvatar
          className="h-7 w-7 border border-border/70"
          src={getAvatarSrc(user.photo_url, user.role)}
          fallbackSrc={getRoleAvatarFallback(user.role)}
          alt={user.full_name}
          initials={getUserInitials(user.full_name)}
          fallbackClassName="text-[11px] font-semibold"
        />
        <span>{user.full_name}</span>
      </div>
    </div>
  );
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
      "id,company_id,activity_id,requested_by_user_id,approved_by_user_id,employee_signature_data_url,technician_signature_data_url,status,starts_at,expires_at,created_at"
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
        .select("id,full_name,role,photo_url")
        .eq("id", permit.requested_by_user_id)
        .maybeSingle(),
      permit.approved_by_user_id
        ? supabase
            .from("app_users")
            .select("id,full_name,role,photo_url")
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
                A PT so pode ser ativada com checklist concluido e assinatura das duas partes.
              </CardDescription>
            </div>
            <Badge variant={statusVariant(permit.status, isExpiredByDate)}>
              {statusLabel(permit.status, isExpiredByDate)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <UserLine label="Solicitante" user={requester} pendingLabel="-" large />
            <UserLine label="Aprovador" user={approver} pendingLabel="Pendente" large />
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
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
          </div>
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
              Checklist 100% + assinaturas obrigatorias para ativacao.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {canApprove && permit.status === "draft" ? (
              <PermitApprovalForm permitId={permit.id} action={approveWorkPermit} />
            ) : (
              <p className="text-sm text-muted-foreground">
                {permit.status === "draft"
                  ? "Sem permissão para aprovar esta PT."
                  : "PT já saiu do estado de rascunho."}
              </p>
            )}

            <div className="space-y-3 rounded-lg border border-border/80 bg-muted/20 p-3">
              <p className="text-sm font-medium">Assinaturas registradas</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Colaborador</p>
                  {permit.employee_signature_data_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={permit.employee_signature_data_url}
                      alt="Assinatura do colaborador"
                      className="h-32 w-full rounded-md border border-border/80 bg-emerald-50/60 object-contain p-2"
                    />
                  ) : (
                    <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                      Assinatura do colaborador nao registrada.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Tecnico</p>
                  {permit.technician_signature_data_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={permit.technician_signature_data_url}
                      alt="Assinatura do tecnico"
                      className="h-32 w-full rounded-md border border-border/80 bg-emerald-50/60 object-contain p-2"
                    />
                  ) : (
                    <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                      Assinatura do tecnico nao registrada.
                    </p>
                  )}
                </div>
              </div>
            </div>

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
