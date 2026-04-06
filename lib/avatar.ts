// Use direct public URLs instead of static imports
// Static imports don't work reliably in server components
const ADMINISTRATOR_FALLBACK = "/administrator.png";
const COLLABORATOR_FALLBACK = "/collaborator.png";

const MANAGEMENT_ROLES = new Set([
  "superadmin",
  "company_admin",
  "safety_technician",
  "administrator",
]);

export function getUserInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function isManagementRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return MANAGEMENT_ROLES.has(role);
}

export function getRoleAvatarFallback(role: string | null | undefined): string {
  if (isManagementRole(role)) {
    return ADMINISTRATOR_FALLBACK;
  }

  // Collaborator (green) is the default for any non-management role
  return COLLABORATOR_FALLBACK;
}

export function getAvatarSrc(
  photoUrl: string | null | undefined,
  role: string | null | undefined
): string {
  const normalized = photoUrl?.trim();
  if (normalized) {
    return normalized;
  }

  return getRoleAvatarFallback(role);
}
