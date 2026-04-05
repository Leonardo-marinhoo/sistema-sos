import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";

const ALLOWED_ROLES = ["company_admin", "safety_technician", "administrator"];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireSession();

  // Superadmins podem acessar (para gestão global)
  if (profile.is_superadmin) {
    return <>{children}</>;
  }

  // Apenas roles de gestão podem acessar
  if (!ALLOWED_ROLES.includes(profile.role)) {
    redirect("/colaborador");
  }

  // Usuário precisa ter uma empresa vinculada
  if (!profile.company_id) {
    redirect("/colaborador");
  }

  return <>{children}</>;
}
