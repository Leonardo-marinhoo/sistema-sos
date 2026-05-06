"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLogger } from "@/lib/logger";

type ProfileLike = {
  id: string;
  company_id?: string | null;
  is_superadmin: boolean;
};

function resolveModuleType(pathname: string, isSuperadmin: boolean) {
  if (pathname.startsWith("/admin")) {
    return isSuperadmin ? "superadmin" : "company";
  }

  if (pathname.startsWith("/colaborador")) {
    return "employee";
  }

  return "company";
}

export function PageMetricsTracker({ profile }: { profile: ProfileLike }) {
  const pathname = usePathname();
  const { startPageSession, endPageSession } = useLogger({
    userId: profile.id,
    companyId: profile.company_id ?? undefined,
  });

  useEffect(() => {
    if (!profile.id) return;

    const moduleType = resolveModuleType(pathname, profile.is_superadmin);
    const sessionId = startPageSession({
      pagePath: pathname,
      moduleType,
    });

    return () => {
      void endPageSession(sessionId);
    };
  }, [pathname, profile.id, profile.company_id, profile.is_superadmin, startPageSession, endPageSession]);

  return null;
}