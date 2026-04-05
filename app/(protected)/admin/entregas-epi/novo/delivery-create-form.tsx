"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormWithToast } from "@/components/ui/form-with-toast";
import { SubmitButton } from "@/components/ui/submit-button";
import { SignaturePad } from "@/components/ui/signature-pad";

type EmployeeOption = {
  id: string;
  fullName: string;
  companyName: string | null;
  jobId: string | null;
  jobName: string | null;
};

type EpiOption = {
  id: string;
  code: string;
  name: string;
};

type JobKitItem = {
  epiId: string;
  epiCode: string;
  epiName: string;
  quantity: number;
  isMandatory: boolean;
};

type DeliveryRow = {
  key: string;
  epiId: string;
  quantity: string;
  expiresAt: string;
};

interface DeliveryCreateFormProps {
  action: (formData: FormData) => Promise<void>;
  employees: EmployeeOption[];
  epis: EpiOption[];
  kitsByJob: Record<string, JobKitItem[]>;
  showEmployeeCompany: boolean;
}

function createRow(index: number): DeliveryRow {
  return {
    key: `row-${Date.now()}-${index}`,
    epiId: "",
    quantity: "",
    expiresAt: "",
  };
}

export function DeliveryCreateForm({
  action,
  employees,
  epis,
  kitsByJob,
  showEmployeeCompany,
}: DeliveryCreateFormProps) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [rows, setRows] = useState<DeliveryRow[]>([createRow(0)]);
  const [receiverSignature, setReceiverSignature] = useState("");
  const [delivererSignature, setDelivererSignature] = useState("");

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === employeeId) ?? null,
    [employeeId, employees]
  );

  const reminderKit = useMemo(() => {
    if (!selectedEmployee?.jobId) return [];
    return kitsByJob[selectedEmployee.jobId] ?? [];
  }, [selectedEmployee, kitsByJob]);

  const addRow = () => {
    setRows((current) => [...current, createRow(current.length)]);
  };

  const removeRow = (key: string) => {
    setRows((current) => {
      if (current.length === 1) return current;
      return current.filter((row) => row.key !== key);
    });
  };

  const updateRow = (key: string, field: keyof Omit<DeliveryRow, "key">, value: string) => {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, [field]: value } : row))
    );
  };

  return (
    <FormWithToast
      action={action}
      successMessage="Entrega registrada com sucesso!"
      redirectTo="/admin/entregas-epi"
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Colaborador</CardTitle>
          <CardDescription>Selecione quem recebera os EPIs nesta entrega.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="employee_user_id">Colaborador</Label>
            <select
              id="employee_user_id"
              name="employee_user_id"
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              required
            >
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName}
                  {employee.jobName ? ` - ${employee.jobName}` : " - Sem cargo"}
                  {showEmployeeCompany && employee.companyName ? ` (${employee.companyName})` : ""}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lembrete de Kit Base do Cargo</CardTitle>
          <CardDescription>
            Lista apenas para consulta. Voce pode registrar entrega parcial livremente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedEmployee?.jobId ? (
            <p className="text-sm text-muted-foreground">Este colaborador nao possui cargo vinculado.</p>
          ) : reminderKit.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nao ha EPIs base vinculados a este cargo ainda.</p>
          ) : (
            <div className="space-y-2">
              {reminderKit.map((item) => (
                <div
                  key={item.epiId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/80 bg-muted/30 p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{item.epiCode} - {item.epiName}</p>
                    <p className="text-muted-foreground">
                      Quantidade base: {item.quantity} | {item.isMandatory ? "Obrigatorio" : "Opcional"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Itens Entregues</CardTitle>
          <CardDescription>Informe somente os EPIs efetivamente entregues nesta operacao.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((row, index) => (
            <div key={row.key} className="grid gap-3 rounded-md border border-border/80 p-3 md:grid-cols-12">
              <div className="space-y-2 md:col-span-6">
                <Label>EPI</Label>
                <select
                  name="epi_ids"
                  value={row.epiId}
                  onChange={(event) => updateRow(row.key, "epiId", event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  required={index === 0}
                >
                  <option value="">Selecione</option>
                  {epis.map((epi) => (
                    <option key={epi.id} value={epi.id}>
                      {epi.code} - {epi.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Quantidade</Label>
                <Input
                  name="quantities"
                  type="number"
                  min={1}
                  value={row.quantity}
                  onChange={(event) => updateRow(row.key, "quantity", event.target.value)}
                  required={index === 0}
                />
              </div>

              <div className="space-y-2 md:col-span-3">
                <Label>Validade</Label>
                <Input
                  name="expires_ats"
                  type="date"
                  value={row.expiresAt}
                  onChange={(event) => updateRow(row.key, "expiresAt", event.target.value)}
                  required={index === 0}
                />
              </div>

              <div className="flex items-end md:col-span-1">
                <Button type="button" variant="ghost" onClick={() => removeRow(row.key)} className="w-full">
                  Remover
                </Button>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addRow}>
            Adicionar item
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assinaturas obrigatorias</CardTitle>
          <CardDescription>
            Colete a assinatura do colaborador e do entregador para concluir o registro.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <SignaturePad
              label="Assinatura do colaborador"
              value={receiverSignature}
              onChange={setReceiverSignature}
              required
            />
            <SignaturePad
              label="Assinatura do entregador"
              value={delivererSignature}
              onChange={setDelivererSignature}
              required
            />
          </div>

          <input type="hidden" name="receiver_signature_data_url" value={receiverSignature} />
          <input type="hidden" name="deliverer_signature_data_url" value={delivererSignature} />

          {(!receiverSignature || !delivererSignature) && (
            <p className="text-sm text-amber-700">
              As duas assinaturas sao obrigatorias para registrar a entrega.
            </p>
          )}

          <div className="rounded-md border border-border/80 bg-muted/30 p-3 text-xs text-muted-foreground">
            Dica: assine com o dedo no celular ou com mouse/caneta no desktop.
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <SubmitButton
          loadingText="Registrando entrega..."
          disabled={!receiverSignature || !delivererSignature}
        >
          Registrar entrega
        </SubmitButton>
      </div>
    </FormWithToast>
  );
}
