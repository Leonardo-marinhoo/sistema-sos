/**
 * Server Actions Logging Wrapper
 * Automatically logs all server actions
 */

import { getLogger } from "@/lib/logger";
import { requireSession } from "@/lib/auth/session";
import { headers } from "next/headers";
import type { EntityType } from "./system-logger";

interface LoggedActionOptions {
  action: "create" | "read" | "update" | "delete" | "approve" | "reject" | "export";
  entityType: EntityType;
  entityId?: string;
  description?: string;
}

/**
 * Wrap a server action to automatically log it
 */
export async function withLogging<T>(
  fn: () => Promise<T>,
  options: LoggedActionOptions
): Promise<T> {
  const session = await requireSession();
  const logger = getLogger();
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  const xForwardedFor = headersList.get("x-forwarded-for") || "unknown";

  const startTime = Date.now();

  try {
    const result = await fn();

    // Log success
    if (session?.profile?.id) {
      await logger.logAction({
        userId: session.profile.id,
        companyId: session.profile.company_id,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId,
        description: options.description,
        ipAddress: xForwardedFor,
        userAgent,
        status: "success",
        durationMs: Date.now() - startTime,
      });
    }

    return result;
  } catch (error) {
    // Log failure
    if (session?.profile?.id) {
      await logger.logAction({
        userId: session.profile.id,
        companyId: session.profile.company_id,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId,
        description: options.description,
        ipAddress: xForwardedFor,
        userAgent,
        status: "failure",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        durationMs: Date.now() - startTime,
      });
    }

    throw error;
  }
}

/**
 * Example usage in a server action:
 *
 * export async function createEpi(data: CreateEpiInput) {
 *     async () => {
 *       // Your actual logic
 *       const epi = await db.epis.create(data);
 *       return epi;
 *     },
 *     {
 *       action: "create",
 *       entityType: "epi",
 *       entityId: epi.id,
 *       description: `EPI created: ${data.name}`,
 *     }
 *   );
 * }
 */
