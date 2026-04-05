import { requireSession } from "@/lib/auth/session";

export default async function ColaboradorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Todos podem acessar o módulo colaborador (para suas próprias coisas)
  await requireSession();

  return <>{children}</>;
}
