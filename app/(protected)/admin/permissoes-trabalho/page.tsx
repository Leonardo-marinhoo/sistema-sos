import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { getAvatarSrc, getRoleAvatarFallback, getUserInitials } from "@/lib/avatar";
import { syncExpiredWorkPermits } from "@/app/(protected)/admin/permissoes-trabalho/actions";

function getStatusVariant(status: string, isExpiredByDate: boolean) {
  if (status === "cancelled") return "destructive" as const;
  if (status === "expired" || isExpiredByDate) return "warning" as const;
  if (status === "active") return "success" as const;
  return "secondary" as const;
}

function getStatusLabel(status: string, isExpiredByDate: boolean) {
  if (status === "cancelled") return "Cancelada";
  if (status === "expired" || isExpiredByDate) return "Expirada";
  if (status === "active") return "Ativa";
  return "Rascunho";
}

export default async function AdminWorkPermitsPage() {
  const { supabase, profile, permissions } = await requireSession();

  const canCreate = profile.is_superadmin || permissions.includes("pt-create");
  const canApprove = profile.is_superadmin || permissions.includes("pt-approve");

  if (!canCreate && !canApprove) {
    redirect("/dashboard");
  }

  let permitQuery = supabase
    .from("work_permits")
    .select("id,company_id,activity_id,requested_by_user_id,approved_by_user_id,status,starts_at,expires_at,created_at")
    .order("created_at", { ascending: false });

  if (!profile.is_superadmin && profile.company_id) {
    permitQuery = permitQuery.eq("company_id", profile.company_id);
  }

  const { data: permitsData, error } = await permitQuery;

  if (error) {
    console.error("Erro ao listar permissoes de trabalho:", error);
  }

  const permits = permitsData ?? [];

  const activityIds = Array.from(new Set(permits.map((item) => item.activity_id)));
  const userIds = Array.from(
    new Set(
      permits.flatMap((item) => [item.requested_by_user_id, item.approved_by_user_id].filter(Boolean) as string[])
    )
  );
  const companyIds = Array.from(new Set(permits.map((item) => item.company_id).filter(Boolean)));

  const [{ data: activitiesData }, { data: usersData }, { data: companiesData }] = await Promise.all([
    activityIds.length
      ? supabase.from("work_activities").select("id,code,title").in("id", activityIds)
      : Promise.resolve({ data: [] as Array<{ id: string; code: string; title: string }> }),
    userIds.length
      ? supabase.from("app_users").select("id,full_name,role,photo_url").in("id", userIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string; role: string; photo_url: string | null }> }),
    profile.is_superadmin && companyIds.length
      ? supabase.from("companies").select("id,name").in("id", companyIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
  ]);

  const activityMap = new Map((activitiesData ?? []).map((item) => [item.id, item]));
  const userMap = new Map((usersData ?? []).map((item) => [item.id, item]));
  const companyMap = new Map((companiesData ?? []).map((item) => [item.id, item.name]));

  const nowIso = new Date().toISOString();
  const activeCount = permits.filter((item) => item.status === "active").length;
  const draftCount = permits.filter((item) => item.status === "draft").length;
  const expiredCount = permits.filter(
    (item) => item.status === "expired" || item.expires_at < nowIso
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-primary/20 bg-gradient-to-br from-emerald-50/80 via-white to-sky-50/70">
        <CardHeader className="pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">Permissões de Trabalho</p>
          <CardTitle className="text-3xl font-black">Centro de Controle de PT</CardTitle>
          <CardDescription>
            Gestão operacional com checklist obrigatório, rastreabilidade e aprovação técnica.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          {canCreate && (
            <Button asChild>
              <Link href="/admin/permissoes-trabalho/novo">Nova PT</Link>
            </Button>
          )}
          {canApprove && (
            <form action={syncExpiredWorkPermits}>
              <Button variant="outline" type="submit">
                Sincronizar vencidas
              </Button>
            </form>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            <Badge variant="secondary">Rascunhos: {draftCount}</Badge>
            <Badge variant="success">Ativas: {activeCount}</Badge>
            <Badge variant="warning">Expiradas: {expiredCount}</Badge>
          </div>
        </CardContent>
      </Card>

      {permits.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center text-sm text-muted-foreground">
            Nenhuma PT cadastrada ainda. Crie a primeira permissão para iniciar o fluxo operacional.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {permits.map((permit) => {
            const activity = activityMap.get(permit.activity_id);
            const requester = userMap.get(permit.requested_by_user_id) ?? null;
            const approver = permit.approved_by_user_id
              ? userMap.get(permit.approved_by_user_id) ?? null
              : null;
            const isExpiredByDate = permit.expires_at < nowIso;

            return (
              <Card key={permit.id} className="group hover:-translate-y-0.5">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl">
                        {activity?.code ?? "ATV"} - {activity?.title ?? "Atividade"}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <span className="inline-flex items-center gap-2">
                          <UserAvatar
                            className="h-6 w-6 border border-border/70"
                            src={getAvatarSrc(requester?.photo_url, requester?.role)}
                            fallbackSrc={getRoleAvatarFallback(requester?.role)}
                            alt={requester?.full_name ?? "Solicitante"}
                            initials={getUserInitials(requester?.full_name ?? "ND")}
                            fallbackClassName="text-[10px] font-semibold"
                          />
                          Solicitante: {requester?.full_name ?? "Nao identificado"}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(permit.status, isExpiredByDate)}>
                      {getStatusLabel(permit.status, isExpiredByDate)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <p>
                      <span className="text-muted-foreground">Início:</span>{" "}
                      {new Date(permit.starts_at).toLocaleString("pt-BR")}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Vencimento:</span>{" "}
                      {new Date(permit.expires_at).toLocaleString("pt-BR")}
                    </p>
                    <p className="sm:col-span-2">
                      <span className="text-muted-foreground">Aprovador:</span>{" "}
                      {approver ? (
                        <span className="inline-flex items-center gap-2">
                            <UserAvatar
                              className="h-6 w-6 border border-border/70"
                              src={getAvatarSrc(approver.photo_url, approver.role)}
                              fallbackSrc={getRoleAvatarFallback(approver.role)}
                              alt={approver.full_name}
                              initials={getUserInitials(approver.full_name)}
                              fallbackClassName="text-[10px] font-semibold"
                            />
                          {approver.full_name}
                        </span>
                      ) : (
                        "Pendente"
                      )}
                    </p>
                    {profile.is_superadmin && (
                      <p className="sm:col-span-2">
                        <span className="text-muted-foreground">Empresa:</span>{" "}
                        {companyMap.get(permit.company_id) ?? "-"}
                      </p>
                    )}
                  </div>

                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/admin/permissoes-trabalho/${permit.id}`}>Abrir PT</Link>
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
