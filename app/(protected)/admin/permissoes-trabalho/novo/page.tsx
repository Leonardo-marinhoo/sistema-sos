import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select-new";
import { Textarea } from "@/components/ui/textarea";
import { FormWithToast } from "@/components/ui/form-with-toast";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSession } from "@/lib/auth/session";
import { createWorkPermit } from "@/app/(protected)/admin/permissoes-trabalho/actions";

export default async function NewWorkPermitPage() {
  const { supabase, profile, permissions } = await requireSession();
  const canCreate = profile.is_superadmin || permissions.includes("pt-create");

  if (!canCreate) {
    redirect("/dashboard");
  }

  const [{ data: activities }, { data: employees }, { data: companies }] = await Promise.all([
    profile.is_superadmin
      ? supabase.from("work_activities").select("id,code,title,company_id").order("title")
      : supabase
          .from("work_activities")
          .select("id,code,title,company_id")
          .eq("company_id", profile.company_id)
          .order("title"),
    profile.is_superadmin
      ? supabase
          .from("app_users")
          .select("id,full_name,company_id,companies(name)")
          .eq("is_active", true)
          .eq("role", "employee")
          .order("full_name")
      : supabase
          .from("app_users")
          .select("id,full_name,company_id,companies(name)")
          .eq("company_id", profile.company_id)
          .eq("is_active", true)
          .eq("role", "employee")
          .order("full_name"),
    profile.is_superadmin
      ? supabase.from("companies").select("id,name").order("name")
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
  ]);

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
          <h1 className="text-3xl font-black">Nova PT</h1>
        </div>
      </div>

      <Card className="border-primary/20 bg-gradient-to-b from-white via-white to-emerald-50/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <Badge variant="outline">Fluxo Crítico PRD</Badge>
          </div>
          <CardTitle>Criar Permissão com Checklist Obrigatório</CardTitle>
          <CardDescription>
            Defina escopo, colaborador executante e checklist de segurança para aprovação técnica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormWithToast
            action={createWorkPermit}
            successMessage="PT criada com sucesso!"
            redirectTo="/admin/permissoes-trabalho"
            className="space-y-6"
          >
            {!profile.is_superadmin && profile.company_id && (
              <input type="hidden" name="company_id" value={profile.company_id} />
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {profile.is_superadmin && (
                <div className="space-y-2">
                  <Label htmlFor="company_id">Empresa</Label>
                  <Select name="company_id" defaultValue={companies?.[0]?.id ?? ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {(companies ?? []).map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="activity_id">Atividade de risco</Label>
                <Select name="activity_id" defaultValue={activities?.[0]?.id ?? ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a atividade" />
                  </SelectTrigger>
                  <SelectContent>
                    {(activities ?? []).map((activity) => (
                      <SelectItem key={activity.id} value={activity.id}>
                        {activity.code} - {activity.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requested_by_user_id">Colaborador executante</Label>
              <Select name="requested_by_user_id" defaultValue={employees?.[0]?.id ?? ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {(employees ?? []).map((employee) => {
                    const companyRel = employee.companies as { name?: string } | Array<{ name?: string }> | null;
                    const companyName = Array.isArray(companyRel) ? companyRel[0]?.name : companyRel?.name;

                    return (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.full_name}
                        {profile.is_superadmin && companyName ? ` - ${companyName}` : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="starts_at">Início</Label>
                <Input id="starts_at" name="starts_at" type="datetime-local" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires_at">Vencimento</Label>
                <Input id="expires_at" name="expires_at" type="datetime-local" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="checklist_raw">Checklist (1 item por linha)</Label>
              <Textarea
                id="checklist_raw"
                name="checklist_raw"
                required
                placeholder={"Inspecionar EPIs obrigatórios\nValidar isolamento da área\nConferir autorização NR aplicável"}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <SubmitButton loadingText="Criando PT...">Criar PT</SubmitButton>
              <Button variant="outline" asChild>
                <Link href="/admin/permissoes-trabalho">Cancelar</Link>
              </Button>
            </div>
          </FormWithToast>
        </CardContent>
      </Card>
    </div>
  );
}
