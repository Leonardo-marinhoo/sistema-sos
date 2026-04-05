import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { getDefaultRoute } from "@/lib/auth/permissions";

// Esta página redireciona para o módulo correto baseado no perfil
export default async function DashboardRedirect() {
  const { profile } = await requireSession();
  const defaultRoute = getDefaultRoute(profile.is_superadmin, profile.role);
  redirect(defaultRoute);
}
