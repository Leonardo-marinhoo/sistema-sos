import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/session";
import { EMPLOYEE_WITH_COMPANY_AND_JOB_SELECT } from "@/lib/supabase/selects";
import { createEpiDelivery } from "@/app/(protected)/admin/entregas-epi/actions";
import { DeliveryCreateForm } from "@/app/(protected)/admin/entregas-epi/novo/delivery-create-form";

export default async function NewEpiDeliveryPage() {
  const { supabase, profile } = await requirePermission("epi-deliver");

  const { data: employeesData } = profile.is_superadmin
    ? await supabase
        .from("app_users")
      .select(EMPLOYEE_WITH_COMPANY_AND_JOB_SELECT)
        .eq("is_active", true)
        .eq("role", "employee")
        .order("full_name", { ascending: true })
    : await supabase
        .from("app_users")
      .select(EMPLOYEE_WITH_COMPANY_AND_JOB_SELECT)
        .eq("company_id", profile.company_id)
        .eq("is_active", true)
        .eq("role", "employee")
        .order("full_name", { ascending: true });

  const employees = (employeesData ?? []).map((employee) => {
    const companyRel = employee.companies as { name?: string } | Array<{ name?: string }> | null;
    const jobRel = employee.job as { name?: string } | Array<{ name?: string }> | null;
    const companyName = Array.isArray(companyRel) ? companyRel[0]?.name : companyRel?.name;
    const jobName = Array.isArray(jobRel) ? jobRel[0]?.name : jobRel?.name;

    return {
      id: employee.id,
      fullName: employee.full_name,
      role: employee.role,
      photoUrl: employee.photo_url,
      companyName: companyName ?? null,
      jobId: employee.job_id,
      jobName: jobName ?? null,
    };
  });

  const { data: episData } = profile.is_superadmin
    ? await supabase
        .from("epis")
        .select("id,code,name")
        .order("name", { ascending: true })
    : await supabase
        .from("epis")
        .select("id,code,name")
        .eq("company_id", profile.company_id)
        .order("name", { ascending: true });

  const epis = (episData ?? []).map((epi) => ({
    id: epi.id,
    code: epi.code,
    name: epi.name,
  }));

  const jobIds = Array.from(new Set(employees.map((employee) => employee.jobId).filter(Boolean) as string[]));

  const kitRows: Array<{
    job_id: string;
    epi_id: string;
    quantity: number;
    is_mandatory: boolean;
    version: number;
    epis: { code?: string; name?: string } | Array<{ code?: string; name?: string }> | null;
  }> = [];

  if (jobIds.length) {
    const { data } = await supabase
      .from("job_epi_kits")
      .select("job_id,epi_id,quantity,is_mandatory,version,epis(code,name)")
      .in("job_id", jobIds);

    if (data) {
      kitRows.push(...data);
    }
  }

  const latestByKey = new Map<string, {
    jobId: string;
    epiId: string;
    quantity: number;
    isMandatory: boolean;
    version: number;
    epiCode: string;
    epiName: string;
  }>();

  for (const row of kitRows) {
    const key = `${row.job_id}::${row.epi_id}`;
    const current = latestByKey.get(key);
    const epiRel = row.epis as { code?: string; name?: string } | Array<{ code?: string; name?: string }> | null;
    const epiData = Array.isArray(epiRel) ? epiRel[0] : epiRel;

    if (!current || row.version > current.version) {
      latestByKey.set(key, {
        jobId: row.job_id,
        epiId: row.epi_id,
        quantity: row.quantity,
        isMandatory: row.is_mandatory,
        version: row.version,
        epiCode: epiData?.code ?? "EPI",
        epiName: epiData?.name ?? "Sem nome",
      });
    }
  }

  const kitsByJob: Record<string, Array<{
    epiId: string;
    epiCode: string;
    epiName: string;
    quantity: number;
    isMandatory: boolean;
  }>> = {};

  for (const value of latestByKey.values()) {
    if (!kitsByJob[value.jobId]) {
      kitsByJob[value.jobId] = [];
    }

    kitsByJob[value.jobId].push({
      epiId: value.epiId,
      epiCode: value.epiCode,
      epiName: value.epiName,
      quantity: value.quantity,
      isMandatory: value.isMandatory,
    });
  }

  for (const jobId of Object.keys(kitsByJob)) {
    kitsByJob[jobId] = kitsByJob[jobId].sort((a, b) => a.epiName.localeCompare(b.epiName));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/entregas-epi">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Entregas de EPI</p>
          <h1 className="text-3xl font-bold tracking-tight">Nova entrega</h1>
        </div>
      </div>

      {employees.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nao ha colaboradores ativos para receber entrega no escopo atual.
          </CardContent>
        </Card>
      ) : (
        <DeliveryCreateForm
          action={createEpiDelivery}
          employees={employees}
          epis={epis}
          kitsByJob={kitsByJob}
          showEmployeeCompany={profile.is_superadmin}
        />
      )}
    </div>
  );
}
