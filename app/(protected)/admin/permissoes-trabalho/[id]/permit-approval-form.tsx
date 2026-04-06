"use client";

import { useState } from "react";
import { FormWithToast } from "@/components/ui/form-with-toast";
import { SignaturePad } from "@/components/ui/signature-pad";
import { SubmitButton } from "@/components/ui/submit-button";

interface PermitApprovalFormProps {
  permitId: string;
  action: (formData: FormData) => Promise<void>;
}

export function PermitApprovalForm({ permitId, action }: PermitApprovalFormProps) {
  const [employeeSignature, setEmployeeSignature] = useState("");
  const [technicianSignature, setTechnicianSignature] = useState("");

  return (
    <FormWithToast
      action={action}
      successMessage="PT ativada com sucesso!"
      className="space-y-3"
    >
      <input type="hidden" name="permit_id" value={permitId} />
      <input type="hidden" name="employee_signature_data_url" value={employeeSignature} />
      <input type="hidden" name="technician_signature_data_url" value={technicianSignature} />

      <div className="grid gap-4 md:grid-cols-2">
        <SignaturePad
          label="Assinatura do colaborador"
          value={employeeSignature}
          onChange={setEmployeeSignature}
          required
        />
        <SignaturePad
          label="Assinatura do tecnico"
          value={technicianSignature}
          onChange={setTechnicianSignature}
          required
        />
      </div>

      {(!employeeSignature || !technicianSignature) && (
        <p className="text-sm text-amber-700">As duas assinaturas sao obrigatorias para ativar a PT.</p>
      )}

      <SubmitButton
        className="w-full"
        loadingText="Ativando PT..."
        disabled={!employeeSignature || !technicianSignature}
      >
        Ativar PT
      </SubmitButton>
    </FormWithToast>
  );
}
