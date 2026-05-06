"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth/session";
import { withLogging } from "@/lib/logger/server-action-logger";

const companySchema = z.object({
  name: z.string().min(2),
  legal_name: z.string().min(2),
  document_number: z.string().min(8),
});

export async function createCompany(formData: FormData) {
  return withLogging(
    async () => {
      const { supabase, profile } = await requireSuperAdmin();

      const payload = companySchema.safeParse({
        name: formData.get("name"),
        legal_name: formData.get("legal_name"),
        document_number: formData.get("document_number"),
      });

      if (!payload.success) {
        throw new Error("Dados invalidos para empresa.");
      }

      const { error } = await supabase.from("companies").insert({
        ...payload.data,
        created_by_user_id: profile.id,
      });

      if (error) {
        throw new Error(error.message);
      }

      revalidatePath("/dashboard/companies");
    },
    {
      action: "create",
      entityType: "company",
    }
  );
}
