import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { getDefaultRoute } from "@/lib/auth/permissions";
import { AppShell } from "@/components/shell/app-shell";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { profile, permissions, supabase } = await requireSession();

  // Buscar nome da empresa se o usuário pertence a uma
  let companyName: string | undefined;
  if (profile.company_id) {
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", profile.company_id)
      .single();
    companyName = company?.name;
  }

  return (
    <AppShell
      profile={{
        ...profile,
        company_name: companyName,
      }}
      permissions={permissions}
    >
      {children}
    </AppShell>
  );
}
