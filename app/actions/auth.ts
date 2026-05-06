"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getLogger } from "@/lib/logger";
import { headers } from "next/headers";
import { requireSession } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "Senha invalida"),
});

export type LoginActionState = {
  error?: string;
};

export async function signIn(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const validation = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validation.success) {
    return { error: validation.error.issues[0]?.message ?? "Dados invalidos" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(validation.data);

  if (error) {
    return { error: "Falha no login. Confira email e senha." };
  }

  const { data: authUserData } = await supabase.auth.getUser();
  if (authUserData.user) {
    const { data: appUser } = await supabase
      .from("app_users")
      .select("id,company_id")
      .eq("auth_user_id", authUserData.user.id)
      .maybeSingle();

    const requestHeaders = await headers();
    const logger = getLogger();

    await logger.logAccess({
      userId: appUser?.id ?? authUserData.user.id,
      action: "login",
      ipAddress: requestHeaders.get("x-forwarded-for") || requestHeaders.get("x-real-ip") || "unknown",
      userAgent: requestHeaders.get("user-agent") || "",
    });
  }

  redirect("/dashboard");
}

export async function signOut() {
  const session = await requireSession();
  const requestHeaders = await headers();
  const logger = getLogger();

  await logger.logAccess({
    userId: session.profile.id,
    action: "logout",
    ipAddress: requestHeaders.get("x-forwarded-for") || requestHeaders.get("x-real-ip") || "unknown",
    userAgent: requestHeaders.get("user-agent") || "",
  });

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
