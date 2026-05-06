/**
 * EXEMPLO: Como Integrar Logging em Actions Existentes
 * 
 * Este arquivo mostra como modificar a action de login para incluir logging.
 * Copie os padrões para suas actions existentes.
 */

"use server";

import { getLogger } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

/**
 * EXEMPLO 1: Logging de Login
 * Modifique sua action signIn para adicionar este código
 */
export async function exampleSignInWithLogging(data: {
  email: string;
  password: string;
}) {
  const logger = getLogger();
  const headersList = headers();
  const userAgent = headersList.get("user-agent") || "";
  const xForwardedFor = headersList.get("x-forwarded-for") || "unknown";

  const supabase = await createSupabaseServerClient();

  // Attempt login
  const { data: authData, error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    // Log failed login attempt
    await logger.logAccess({
      userId: "unknown", // ou capture o user ID se possível
      action: "login",
      ipAddress: xForwardedFor,
      userAgent,
    });

    throw new Error("Login failed");
  }

  // Get app_user to access company_id
  const { data: appUser } = await supabase
    .from("app_users")
    .select("id, company_id")
    .eq("auth_user_id", authData.user.id)
    .single();

  // Log successful login
  await logger.logAccess({
    userId: authData.user.id,
    action: "login",
    ipAddress: xForwardedFor,
    userAgent,
  });

  // Also log initial system action
  await logger.logAction({
    userId: authData.user.id,
    companyId: appUser?.company_id,
    action: "read",
    entityType: "system",
    description: "User logged in to system",
    ipAddress: xForwardedFor,
    userAgent,
  });

  return authData;
}

/**
 * EXEMPLO 2: Logging de Operação com Sucesso/Erro
 * Use para qualquer action que cria, atualiza ou deleta
 */
export async function exampleCreateEpi(data: {
  name: string;
  code: string;
  companyId: string;
  categoryId: string;
}) {
  const supabase = await createSupabaseServerClient();
  const logger = getLogger();
  const headersList = headers();
  const userAgent = headersList.get("user-agent") || "";

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  try {
    // Create EPI
    const { data: epi, error } = await supabase
      .from("epis")
      .insert({
        name: data.name,
        code: data.code,
        company_id: data.companyId,
        category_id: data.categoryId,
      })
      .select()
      .single();

    if (error) throw error;

    // Log successful creation
    await logger.logAction({
      userId: user.id,
      companyId: data.companyId,
      action: "create",
      entityType: "epi",
      entityId: epi.id,
      newValues: epi,
      description: `EPI created: ${epi.name} (${epi.code})`,
      userAgent,
      status: "success",
    });

    return epi;
  } catch (error) {
    // Log failed creation
    await logger.logAction({
      userId: user.id,
      companyId: data.companyId,
      action: "create",
      entityType: "epi",
      newValues: data,
      description: `Failed to create EPI: ${data.name}`,
      userAgent,
      status: "failure",
      errorMessage:
        error instanceof Error ? error.message : "Unknown error",
    });

    throw error;
  }
}

/**
 * EXEMPLO 3: Logging de Atualização com Comparação Old/New Values
 */
export async function exampleUpdateEpi(epiId: string, updates: Record<string, any>) {
  const supabase = await createSupabaseServerClient();
  const logger = getLogger();
  const headersList = headers();
  const userAgent = headersList.get("user-agent") || "";

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  try {
    // Get old values before update
    const { data: oldEpi } = await supabase
      .from("epis")
      .select("*")
      .eq("id", epiId)
      .single();

    // Update
    const { data: updatedEpi, error } = await supabase
      .from("epis")
      .update(updates)
      .eq("id", epiId)
      .select()
      .single();

    if (error) throw error;

    // Log update with before/after
    await logger.logAction({
      userId: user.id,
      companyId: updatedEpi.company_id,
      action: "update",
      entityType: "epi",
      entityId: epiId,
      oldValues: oldEpi,
      newValues: updatedEpi,
      description: `EPI updated: ${updatedEpi.name}`,
      userAgent,
      status: "success",
    });

    return updatedEpi;
  } catch (error) {
    await logger.logAction({
      userId: user.id,
      action: "update",
      entityType: "epi",
      entityId: epiId,
      description: `Failed to update EPI`,
      userAgent,
      status: "failure",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/**
 * EXEMPLO 4: Usando withLogging wrapper (recomendado)
 */
import { withLogging } from "@/lib/logger";

export async function exampleCreateEpiWithWrapper(data: {
  name: string;
  code: string;
  companyId: string;
}) {
  return withLogging(
    async () => {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { data: epi } = await supabase
        .from("epis")
        .insert({
          name: data.name,
          code: data.code,
          company_id: data.companyId,
          created_by_user_id: user?.id,
        })
        .select()
        .single();

      return epi;
    },
    {
      action: "create",
      entityType: "epi",
      description: `EPI created: ${data.name}`,
    }
  );
}

/**
 * INTEGRAÇÃO CHECKLIST
 *
 * Para cada action existente que precisa de logging:
 *
 * [ ] 1. Import getLogger ou withLogging
 * [ ] 2. Import headers para capturar IP/UserAgent
 * [ ] 3. Obter user ID do supabase.auth.getUser()
 * [ ] 4. Obter company_id da tabela app_users
 * [ ] 5. Chamar logger.logAction com os devidos parâmetros
 * [ ] 6. Incluir try/catch para capturar erros
 * [ ] 7. Testar em desenvolvimento
 * [ ] 8. Verificar no /admin/metricas
 *
 * PADRÃO RECOMENDADO: Use withLogging() para simplicidade
 */
