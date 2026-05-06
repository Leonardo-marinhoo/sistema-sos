/**
 * Super Admin API Module
 * All API calls related to super admin operations and metrics
 */

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface AccessLog {
  id: string;
  user_id: string;
  app_users?: {
    full_name: string;
    email: string;
    role: string;
  } | null;
  action: "login" | "logout" | "session_timeout";
  ip_address: string;
  device_type: string;
  browser_name: string;
  browser_version: string;
  os_name: string;
  os_version: string;
  created_at: string;
}

export interface ActionLog {
  id: string;
  user_id: string;
  company_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  description: string | null;
  ip_address: string;
  status: "success" | "failure" | "denied";
  error_message: string | null;
  created_at: string;
  duration_ms: number | null;
}

export interface UserActivitySummary {
  id: string;
  user_id: string;
  company_id: string | null;
  last_login: string | null;
  last_logout: string | null;
  total_logins: number;
  total_actions: number;
  days_active_last_30: number;
  last_activity_date: string | null;
  updated_at: string;
}

export interface DailyActivitySummary {
  id: string;
  company_id: string | null;
  date: string;
  total_logins: number;
  total_logouts: number;
  active_users: number;
  total_actions: number;
  actions_by_type: Record<string, number>;
  most_active_user_id: string | null;
  most_accessed_page: string | null;
}

/**
 * Get access logs with pagination and filters
 */
export async function getAccessLogs(options?: {
  limit?: number;
  offset?: number;
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}) {
  const supabase = createSupabaseBrowserClient();

  try {
    let query = supabase
      .from("system_access_logs")
      .select("*, app_users:user_id(full_name, email, role)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (options?.userId) {
      query = query.eq("user_id", options.userId);
    }

    if (options?.action) {
      query = query.eq("action", options.action);
    }

    if (options?.startDate) {
      query = query.gte("created_at", options.startDate);
    }

    if (options?.endDate) {
      query = query.lte("created_at", options.endDate);
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      data: data as AccessLog[],
      total: count || 0,
      hasMore: (offset + limit) < (count || 0),
    };
  } catch (error) {
    console.error("[getAccessLogs] Error:", error);
    throw error;
  }
}

/**
 * Get action logs with pagination and filters
 */
export async function getActionLogs(options?: {
  limit?: number;
  offset?: number;
  userId?: string;
  companyId?: string;
  entityType?: string;
  action?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  const supabase = createSupabaseBrowserClient();

  try {
    let query = supabase
      .from("user_action_logs")
      .select("*, app_users:user_id(full_name, email)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (options?.userId) {
      query = query.eq("user_id", options.userId);
    }

    if (options?.companyId) {
      query = query.eq("company_id", options.companyId);
    }

    if (options?.entityType) {
      query = query.eq("entity_type", options.entityType);
    }

    if (options?.action) {
      query = query.eq("action", options.action);
    }

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    if (options?.startDate) {
      query = query.gte("created_at", options.startDate);
    }

    if (options?.endDate) {
      query = query.lte("created_at", options.endDate);
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      data: data as ActionLog[],
      total: count || 0,
      hasMore: (offset + limit) < (count || 0),
    };
  } catch (error) {
    console.error("[getActionLogs] Error:", error);
    throw error;
  }
}

/**
 * Get user activity summary
 */
export async function getUserActivitySummary(options?: {
  limit?: number;
  offset?: number;
  companyId?: string;
  inactiveDaysThreshold?: number;
}) {
  const supabase = createSupabaseBrowserClient();

  try {
    let query = supabase
      .from("user_activity_summary")
      .select("*, app_users:user_id(full_name, email, role, company:company_id(name))", {
        count: "exact",
      })
      .order("last_activity_date", { ascending: false, nullsFirst: false });

    if (options?.companyId) {
      query = query.eq("company_id", options.companyId);
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      data: data as UserActivitySummary[],
      total: count || 0,
      hasMore: (offset + limit) < (count || 0),
    };
  } catch (error) {
    console.error("[getUserActivitySummary] Error:", error);
    throw error;
  }
}

/**
 * Get daily activity summary
 */
export async function getDailyActivitySummary(options?: {
  limit?: number;
  offset?: number;
  companyId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const supabase = createSupabaseBrowserClient();

  try {
    let query = supabase
      .from("daily_activity_summary")
      .select("*, companies:company_id(name)", { count: "exact" })
      .order("date", { ascending: false });

    if (options?.companyId) {
      query = query.eq("company_id", options.companyId);
    }

    if (options?.startDate) {
      const startDateOnly = options.startDate.split("T")[0];
      query = query.gte("date", startDateOnly);
    }

    if (options?.endDate) {
      const endDateOnly = options.endDate.split("T")[0];
      query = query.lte("date", endDateOnly);
    }

    const limit = options?.limit || 30;
    const offset = options?.offset || 0;

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      data: data as DailyActivitySummary[],
      total: count || 0,
      hasMore: (offset + limit) < (count || 0),
    };
  } catch (error) {
    console.error("[getDailyActivitySummary] Error:", error);
    throw error;
  }
}

/**
 * Get metrics overview for dashboard
 */
export async function getMetricsOverview() {
  const supabase = createSupabaseBrowserClient();

  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const { count: loginCount } = await supabase
      .from("system_access_logs")
      .select("id", { count: "exact", head: true })
      .eq("action", "login")
      .gte("created_at", startOfToday.toISOString())
      .lt("created_at", startOfTomorrow.toISOString());

    const { count: actionCount } = await supabase
      .from("user_action_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfToday.toISOString())
      .lt("created_at", startOfTomorrow.toISOString());

    const { data: todayActiveUsers } = await supabase
      .from("system_access_logs")
      .select("user_id")
      .eq("action", "login")
      .gte("created_at", startOfToday.toISOString())
      .lt("created_at", startOfTomorrow.toISOString());

    const activeUsersToday = new Set(
      (todayActiveUsers ?? []).map((item: { user_id: string }) => item.user_id)
    ).size;

    // Get active users (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const { data: recentActive } = await supabase
      .from("user_activity_summary")
      .select("*", { count: "exact" })
      .gte("last_activity_date", sevenDaysAgo);

    // Get total users
    const { data: allUsers, count: totalUsers } = await supabase
      .from("app_users")
      .select("*", { count: "exact" })
      .eq("is_active", true);

    // Get inactive users (no activity in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const { data: inactiveUsers, count: inactiveCount } = await supabase
      .from("user_activity_summary")
      .select("*", { count: "exact" })
      .lt("last_activity_date", thirtyDaysAgo);

    return {
      today: {
        logins: loginCount || 0,
        actions: actionCount || 0,
        activeUsers: activeUsersToday || 0,
      },
      weekly: {
        activeUsers: recentActive?.length || 0,
      },
      overall: {
        totalUsers: totalUsers || 0,
        inactiveUsers: inactiveCount || 0,
      },
    };
  } catch (error) {
    console.error("[getMetricsOverview] Error:", error);
    throw error;
  }
}

/**
 * Get page access statistics
 */
export async function getPageAccessStats(options?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<Array<{ page: string; count: number }>> {
  const supabase = createSupabaseBrowserClient();

  try {
    let query = supabase
      .from("page_access_metrics")
      .select("page_path, module_type", { count: "exact" })
      .order("accessed_at", { ascending: false });

    if (options?.startDate) {
      query = query.gte("accessed_at", options.startDate);
    }

    if (options?.endDate) {
      query = query.lte("accessed_at", options.endDate);
    }

    const { data } = await query.limit(options?.limit || 1000);

    // Group and count
    const stats = (data || []).reduce(
      (acc: Record<string, number>, item: any) => {
        const key = item.page_path;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {}
    );

    return Object.entries(stats)
      .map(([page, count]) => ({ page, count: count as number }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error("[getPageAccessStats] Error:", error);
    throw error;
  }
}
