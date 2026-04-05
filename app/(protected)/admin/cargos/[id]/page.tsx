import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FormWithToast } from "@/components/ui/form-with-toast";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select-new";
import { deleteJob, saveJobKitItem } from "@/app/(protected)/admin/cargos/actions";
import { requirePermission, requireSession } from "@/lib/auth/session";

export default async function JobViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission("user-manage");
  const { supabase, profile } = await requireSession();

  let query = supabase
    .from("jobs")
    .select("id,name,description,company_id,companies(name),created_at,updated_at")
    .eq("id", id);

  if (!profile.is_superadmin && profile.company_id) {
    query = query.eq("company_id", profile.company_id);
  }

  const { data: job } = await query.maybeSingle();
  if (!job) notFound();

  const [{ data: episData }, { data: kitRows }] = await Promise.all([
    supabase
      .from("epis")
      .select("id,code,name")
      .eq("company_id", job.company_id)
      .order("name", { ascending: true }),
    supabase
      .from("job_epi_kits")
      .select("id,epi_id,quantity,is_mandatory,version,created_at,epis(code,name)")
      .eq("job_id", job.id),
  ]);

  const companyRel = job.companies as { name?: string } | Array<{ name?: string }> | null;
  const companyName = Array.isArray(companyRel) ? companyRel[0]?.name : companyRel?.name;

  const latestKitByEpi = new Map<string, {
    epiId: string;
    quantity: number;
    isMandatory: boolean;
    version: number;
    createdAt: string;
    epiCode: string;
    epiName: string;
  }>();

  for (const row of kitRows ?? []) {
    const epiRel = row.epis as { code?: string; name?: string } | Array<{ code?: string; name?: string }> | null;
    const epiData = Array.isArray(epiRel) ? epiRel[0] : epiRel;
    const current = latestKitByEpi.get(row.epi_id);

    if (!current || row.version > current.version) {
      latestKitByEpi.set(row.epi_id, {
        epiId: row.epi_id,
        quantity: row.quantity,
        isMandatory: row.is_mandatory,
        version: row.version,
        createdAt: row.created_at,
        epiCode: epiData?.code ?? "EPI",
        epiName: epiData?.name ?? "Sem nome",
      });
    }
  }

  const currentKitItems = Array.from(latestKitByEpi.values()).sort((a, b) => a.epiName.localeCompare(b.epiName));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/cargos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Cargos</p>
            <h1 className="text-3xl font-bold tracking-tight">{job.name}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/cargos/${job.id}/editar`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <FormWithToast action={deleteJob} successMessage="Cargo excluido com sucesso!" redirectTo="/admin/cargos">
            <input type="hidden" name="id" value={job.id} />
            <SubmitButton variant="destructive" loadingText="Excluindo...">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </SubmitButton>
          </FormWithToast>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dados do cargo</CardTitle>
            <CardDescription>Informacoes cadastrais do registro.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Nome</span>
              <span className="font-medium text-right">{job.name}</span>
            </div>
            {profile.is_superadmin && (
              <>
                <Separator />
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Empresa</span>
                  <span className="font-medium text-right">{companyName ?? "-"}</span>
                </div>
              </>
            )}
            <Separator />
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">Descricao</p>
              <p className="font-medium">{job.description || "Sem descricao"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo do kit base</CardTitle>
            <CardDescription>Visao rapida de EPIs vinculados ao cargo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">EPIs no kit</span>
              <Badge variant="secondary">{currentKitItems.length}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Itens obrigatorios</span>
              <Badge>{currentKitItems.filter((item) => item.isMandatory).length}</Badge>
            </div>
            <Separator />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-3 text-sm">
                <p className="text-muted-foreground">Criado em</p>
                <p className="font-medium">{new Date(job.created_at).toLocaleString("pt-BR")}</p>
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <p className="text-muted-foreground">Atualizado em</p>
                <p className="font-medium">{new Date(job.updated_at).toLocaleString("pt-BR")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Kit base de EPIs do cargo</CardTitle>
            <CardDescription>
              Esses EPIs servem como referencia para entrega. Cada inclusao cria uma nova versao do vinculo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <FormWithToast action={saveJobKitItem} successMessage="Item do kit salvo com sucesso!" className="grid gap-3 md:grid-cols-4">
              <input type="hidden" name="job_id" value={job.id} />

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="epi_id">EPI</Label>
                <Select name="epi_id" defaultValue={episData?.[0]?.id ?? ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o EPI" />
                  </SelectTrigger>
                  <SelectContent>
                    {(episData ?? []).map((epi) => (
                      <SelectItem key={epi.id} value={epi.id}>
                        {epi.code} - {epi.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_mandatory">Obrigatoriedade</Label>
                <Select name="is_mandatory" defaultValue="true">
                  <SelectTrigger>
                    <SelectValue placeholder="Obrigatorio?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Obrigatorio</SelectItem>
                    <SelectItem value="false">Opcional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-4">
                <SubmitButton loadingText="Salvando item...">Salvar no kit</SubmitButton>
              </div>
            </FormWithToast>

            {currentKitItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum EPI vinculado a este cargo ainda.</p>
            ) : (
              <div className="space-y-2">
                {currentKitItems.map((item) => (
                  <div key={item.epiId} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/80 p-3 text-sm">
                    <div>
                      <p className="font-medium">{item.epiCode} - {item.epiName}</p>
                      <p className="text-muted-foreground">Quantidade: {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={item.isMandatory ? "default" : "secondary"}>
                        {item.isMandatory ? "Obrigatorio" : "Opcional"}
                      </Badge>
                      <span>v{item.version} - {new Date(item.createdAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
