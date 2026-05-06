/**
 * useLogger Hook
 * React hook for logging system activities
 */

"use client";

import { useCallback } from "react";
import { getLogger } from "@/lib/logger";
import type { EntityType } from "./system-logger";

interface UseLoggerOptions {
  userId?: string;
  companyId?: string;
}

export function useLogger(options?: UseLoggerOptions) {
  const logger = getLogger();

  const logAction = useCallback(
    async (params: {
      action:
        | "create"
        | "read"
        | "update"
        | "delete"
        | "export"
        | "download"
        | "approve"
        | "reject";
      entityType: EntityType;
      entityId?: string;
      description?: string;
      oldValues?: Record<string, any>;
      newValues?: Record<string, any>;
    }) => {
      try {
        // Get current user from context or options
        // In a real app, get from useSession() or auth context
        const userId = options?.userId || "";

        if (!userId) {
          console.warn("[useLogger] No userId provided, skipping log");
          return;
        }

        await logger.logAction({
          userId,
          companyId: options?.companyId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          oldValues: params.oldValues,
          newValues: params.newValues,
          description: params.description,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        });
      } catch (error) {
        console.error("[useLogger] Error logging action:", error);
      }
    },
    [logger, options]
  );

  const logActionWithCatch = useCallback(
    async <T,>(
      params: Omit<
        Parameters<typeof logAction>[0],
        "action" | "entityType"
      > & {
        action:
          | "create"
          | "read"
          | "update"
          | "delete"
          | "export"
          | "download"
          | "approve"
          | "reject";
        entityType: EntityType;
      },
      fn: () => Promise<T>
    ): Promise<T> => {
      try {
        const result = await fn();
        await logAction(params);
        return result;
      } catch (error) {
        await logAction({
          ...params,
          description: `Erro: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
        throw error;
      }
    },
    [logAction]
  );

  const startPageSession = useCallback(
    (params: {
      pagePath: string;
      moduleType: "superadmin" | "company" | "employee" | "login";
    }) => {
      return logger.startPageSession({
        userId: options?.userId || "",
        companyId: options?.companyId,
        pagePath: params.pagePath,
        moduleType: params.moduleType,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      });
    },
    [logger, options]
  );

  const endPageSession = useCallback(
    async (sessionId: string) => {
      await logger.endPageSession(sessionId);
    },
    [logger]
  );

  return {
    logAction,
    logActionWithCatch,
    startPageSession,
    endPageSession,
  };
}
