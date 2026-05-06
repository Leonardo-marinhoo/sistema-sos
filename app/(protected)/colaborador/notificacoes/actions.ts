"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission, requireSession } from "@/lib/auth/session";
import { withLogging } from "@/lib/logger/server-action-logger";

const createSchema = z.object({
  recipient_user_id: z.string().uuid(),
  title: z.string().min(2),
  message: z.string().min(4),
});

export async function createNotification(formData: FormData) {
  return withLogging(
    async () => {
      const { supabase, profile } = await requirePermission("notify-users");
      const payload = createSchema.safeParse({
        recipient_user_id: formData.get("recipient_user_id"),
        title: formData.get("title"),
        message: formData.get("message"),
      });

      if (!payload.success) throw new Error("Dados invalidos");

      const { data: recipient } = await supabase
        .from("app_users")
        .select("company_id")
        .eq("id", payload.data.recipient_user_id)
        .single();

      if (!recipient) throw new Error("Destinatario nao encontrado");
      if (!profile.is_superadmin && recipient.company_id !== profile.company_id) {
        throw new Error("Sem permissao para notificar esse usuario");
      }

      const { error } = await supabase.from("notifications").insert({
        company_id: recipient.company_id,
        recipient_user_id: payload.data.recipient_user_id,
        title: payload.data.title,
        message: payload.data.message,
        created_by_user_id: profile.id,
      });

      if (error) throw new Error(error.message);
      revalidatePath("/colaborador/notificacoes");
    },
    {
      action: "create",
      entityType: "notification",
    }
  );
}

export async function markAsRead(formData: FormData) {
  return withLogging(
    async () => {
      const { supabase, profile } = await requireSession();
      const id = z.string().uuid().parse(formData.get("id"));

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", id)
        .eq("recipient_user_id", profile.id);

      if (error) throw new Error(error.message);
      revalidatePath("/colaborador/notificacoes");
    },
    {
      action: "update",
      entityType: "notification",
    }
  );
}

export async function deleteNotification(formData: FormData) {
  return withLogging(
    async () => {
      const { supabase, profile } = await requireSession();
      const id = z.string().uuid().parse(formData.get("id"));

      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id)
        .eq("recipient_user_id", profile.id);

      if (error) throw new Error(error.message);
      revalidatePath("/colaborador/notificacoes");
    },
    {
      action: "delete",
      entityType: "notification",
    }
  );
}
