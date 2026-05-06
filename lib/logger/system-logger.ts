/**
 * System Logging Library
 * Centralized logging for access, actions, and page metrics
 */

import { createClient } from "@supabase/supabase-js";

export type ActionType =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "export"
  | "download"
  | "approve"
  | "reject"
  | "login"
  | "logout"
  | "session_timeout";

export type EntityType =
  | "epi"
  | "epi_delivery"
  | "epi_exchange"
  | "epi_exchange_request"
  | "work_permit"
  | "user"
  | "company"
  | "job"
  | "work_activity"
  | "work_report"
  | "document"
  | "permission"
  | "notification";

type ActionStatus = "success" | "failure" | "denied";

interface LogAccessParams {
  userId: string;
  action: "login" | "logout" | "session_timeout";
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
}

interface LogActionParams {
  userId: string;
  companyId?: string;
  action: ActionType;
  entityType: EntityType;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  status?: ActionStatus;
  errorMessage?: string;
  durationMs?: number;
}

interface LogPageAccessParams {
  userId: string;
  companyId?: string;
  pagePath: string;
  moduleType: "superadmin" | "company" | "employee" | "login";
  durationSeconds?: number;
  ipAddress?: string;
  userAgent?: string;
}

interface PageAccessSession {
  userId: string;
  companyId?: string;
  pagePath: string;
  moduleType: "superadmin" | "company" | "employee" | "login";
  ipAddress?: string;
  userAgent?: string;
  startTime: number;
}

/**
 * Parse user agent to extract device, browser, and OS info
 */
function parseUserAgent(userAgent: string) {
  // Simple parsing - can be enhanced with ua-parser-js if needed
  const ua = userAgent.toLowerCase();

  // Device type detection
  let deviceType = "web";
  if (/mobile|android|iphone/.test(ua)) deviceType = "mobile";
  else if (/tablet|ipad/.test(ua)) deviceType = "tablet";

  // Browser detection
  let browserName = "Unknown";
  let browserVersion = "";

  if (/chrome/.test(ua) && !/edge|edg/.test(ua)) {
    browserName = "Chrome";
    browserVersion = ua.match(/chrome\/([\d.]+)/)?.[1] || "";
  } else if (/safari/.test(ua) && !/chrome/.test(ua)) {
    browserName = "Safari";
    browserVersion = ua.match(/version\/([\d.]+)/)?.[1] || "";
  } else if (/edge|edg/.test(ua)) {
    browserName = "Edge";
    browserVersion = ua.match(/edg\/([\d.]+)/)?.[1] || "";
  } else if (/firefox/.test(ua)) {
    browserName = "Firefox";
    browserVersion = ua.match(/firefox\/([\d.]+)/)?.[1] || "";
  }

  // OS detection
  let osName = "Unknown";
  let osVersion = "";

  if (/windows/.test(ua)) {
    osName = "Windows";
    osVersion = ua.match(/windows nt ([\d.]+)/)?.[1] || "";
  } else if (/macintosh/.test(ua)) {
    osName = "macOS";
    osVersion = ua.match(/os x ([\d_]+)/)?.[1]?.replace(/_/g, ".") || "";
  } else if (/android/.test(ua)) {
    osName = "Android";
    osVersion = ua.match(/android ([\d.]+)/)?.[1] || "";
  } else if (/iphone|ipad/.test(ua)) {
    osName = "iOS";
    osVersion = ua.match(/os ([\d_]+)/)?.[1]?.replace(/_/g, ".") || "";
  } else if (/linux/.test(ua)) {
    osName = "Linux";
  }

  return { deviceType, browserName, browserVersion, osName, osVersion };
}

/**
 * Get client IP address from various sources
 */
function getClientIp(request?: any): string {
  if (!request) return "unknown";

  // Try to get from x-forwarded-for first (proxy)
  const forwarded = request.headers?.get?.("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  // Then try x-real-ip
  const xRealIp = request.headers?.get?.("x-real-ip");
  if (xRealIp) return xRealIp;

  // Then try cf-connecting-ip (Cloudflare)
  const cfIp = request.headers?.get?.("cf-connecting-ip");
  if (cfIp) return cfIp;

  return "unknown";
}

export class SystemLogger {
  private supabase: any;
  private pageSessionMap: Map<string, PageAccessSession> = new Map();

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    private supabaseAdmin?: any
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Log system access (login/logout)
   */
  async logAccess(params: LogAccessParams): Promise<void> {
    try {
      const ua = params.userAgent || "";
      const { deviceType, browserName, browserVersion, osName, osVersion } =
        parseUserAgent(ua);

      const { error } = await this.supabase.from("system_access_logs").insert({
        user_id: params.userId,
        action: params.action,
        ip_address: params.ipAddress || "unknown",
        user_agent: ua,
        device_type: params.deviceType || deviceType,
        browser_name: params.browserName || browserName,
        browser_version: params.browserVersion || browserVersion,
        os_name: params.osName || osName,
        os_version: params.osVersion || osVersion,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("[SystemLogger] Error logging access:", error);
    }
  }

  /**
   * Log user action (CRUD, approvals, etc)
   */
  async logAction(params: LogActionParams): Promise<void> {
    try {
      const { error } = await this.supabase.from("user_action_logs").insert({
        user_id: params.userId,
        company_id: params.companyId,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        old_values: params.oldValues || null,
        new_values: params.newValues || null,
        description: params.description,
        ip_address: params.ipAddress || "unknown",
        user_agent: params.userAgent || "",
        status: params.status || "success",
        error_message: params.errorMessage,
        duration_ms: params.durationMs,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("[SystemLogger] Error logging action:", error);
    }
  }

  /**
   * Start tracking page access session
   */
  startPageSession(params: Omit<PageAccessSession, "startTime">): string {
    const sessionId = `${params.userId}-${Date.now()}`;
    this.pageSessionMap.set(sessionId, {
      ...params,
      startTime: Date.now(),
    });
    return sessionId;
  }

  /**
   * End page access session and log it
   */
  async endPageSession(sessionId: string): Promise<void> {
    const session = this.pageSessionMap.get(sessionId);
    if (!session) return;

    try {
      const durationSeconds = Math.floor(
        (Date.now() - session.startTime) / 1000
      );

      const { error } = await this.supabase.from("page_access_metrics").insert({
        user_id: session.userId,
        company_id: session.companyId,
        page_path: session.pagePath,
        module_type: session.moduleType,
        duration_seconds: durationSeconds,
        ip_address: session.ipAddress || "unknown",
        user_agent: session.userAgent || "",
        accessed_at: new Date(session.startTime).toISOString(),
        left_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      this.pageSessionMap.delete(sessionId);
    } catch (error) {
      console.error("[SystemLogger] Error logging page access:", error);
    }
  }

  /**
   * Utility: Log action with try-catch wrapper
   */
  async logActionWithTryCatch<T>(params: Omit<LogActionParams, "status" | "errorMessage" | "durationMs">, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      await this.logAction({
        ...params,
        status: "success",
        durationMs: Date.now() - startTime,
      });
      return result;
    } catch (error) {
      await this.logAction({
        ...params,
        status: "failure",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        durationMs: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Export logs for analytics (admin only)
   */
  async getAccessLogs(filters?: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    action?: string;
  }) {
    let query = this.supabase
      .from("system_access_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.userId) {
      query = query.eq("user_id", filters.userId);
    }
    if (filters?.action) {
      query = query.eq("action", filters.action);
    }
    if (filters?.startDate) {
      query = query.gte("created_at", filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      query = query.lte("created_at", filters.endDate.toISOString());
    }

    return query;
  }

  async getActionLogs(filters?: {
    userId?: string;
    companyId?: string;
    entityType?: string;
    action?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    let query = this.supabase
      .from("user_action_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.userId) {
      query = query.eq("user_id", filters.userId);
    }
    if (filters?.companyId) {
      query = query.eq("company_id", filters.companyId);
    }
    if (filters?.entityType) {
      query = query.eq("entity_type", filters.entityType);
    }
    if (filters?.action) {
      query = query.eq("action", filters.action);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.startDate) {
      query = query.gte("created_at", filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      query = query.lte("created_at", filters.endDate.toISOString());
    }

    return query;
  }

  async getUserActivitySummary(filters?: { companyId?: string }) {
    let query = this.supabase
      .from("user_activity_summary")
      .select("*")
      .order("last_activity_date", { ascending: false });

    if (filters?.companyId) {
      query = query.eq("company_id", filters.companyId);
    }

    return query;
  }

  async getDailyActivitySummary(filters?: {
    companyId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    let query = this.supabase
      .from("daily_activity_summary")
      .select("*")
      .order("date", { ascending: false });

    if (filters?.companyId) {
      query = query.eq("company_id", filters.companyId);
    }
    if (filters?.startDate) {
      query = query.gte("date", filters.startDate.toISOString().split("T")[0]);
    }
    if (filters?.endDate) {
      query = query.lte("date", filters.endDate.toISOString().split("T")[0]);
    }

    return query;
  }
}
