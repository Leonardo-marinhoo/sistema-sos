import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Building2,
  ClipboardCheck,
  FileSignature,
  HardHat,
  LayoutDashboard,
  ShieldCheck,
  UsersRound,
  Wrench,
  Package,
} from "lucide-react";

export type AppPermission =
  | "user-manage"
  | "permission-manage"
  | "epi-deliver"
  | "epi-exchange-request"
  | "epi-exchange-review"
  | "notify-users"
  | "pt-create"
  | "pt-approve"
  | "risk-manage"
  | "report-create"
  | "report-read"
  | "document-manage"
  | "notification-read";

export type NavModule = "Superadmin" | "Empresa" | "Colaborador";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  module: NavModule;
  requiredPermissions?: AppPermission[];
  superadminOnly?: boolean;
  allowedRoles?: ("company_admin" | "safety_technician" | "administrator" | "employee")[];
};

// Itens de navegação organizados por módulo
export const NAV_ITEMS: NavItem[] = [
  // === SUPERADMIN (apenas is_superadmin) ===
  {
    label: "Dashboard SaaS",
    href: "/admin",
    icon: LayoutDashboard,
    module: "Superadmin",
    superadminOnly: true,
  },
  {
    label: "Empresas",
    href: "/admin/empresas",
    icon: Building2,
    module: "Superadmin",
    superadminOnly: true,
  },
  {
    label: "Usuários Global",
    href: "/admin/usuarios",
    icon: UsersRound,
    module: "Superadmin",
    superadminOnly: true,
  },
  {
    label: "Permissões de Trabalho",
    href: "/admin/permissoes-trabalho",
    icon: FileSignature,
    module: "Superadmin",
    superadminOnly: true,
  },
  {
    label: "Métricas do Sistema",
    href: "/admin/metricas",
    icon: LayoutDashboard,
    module: "Superadmin",
    superadminOnly: true,
  },

  // === EMPRESA (company_admin, safety_technician, administrator) ===
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    module: "Empresa",
    allowedRoles: ["company_admin", "safety_technician", "administrator"],
  },
  {
    label: "Usuários",
    href: "/admin/usuarios",
    icon: UsersRound,
    module: "Empresa",
    requiredPermissions: ["user-manage"],
    allowedRoles: ["company_admin", "safety_technician", "administrator"],
  },
  {
    label: "Cargos",
    href: "/admin/cargos",
    icon: ShieldCheck,
    module: "Empresa",
    requiredPermissions: ["user-manage"],
    allowedRoles: ["company_admin", "safety_technician", "administrator"],
  },
  {
    label: "EPIs",
    href: "/admin/epis",
    icon: HardHat,
    module: "Empresa",
    requiredPermissions: ["epi-deliver"],
    allowedRoles: ["company_admin", "safety_technician", "administrator"],
  },
  {
    label: "Entregas de EPI",
    href: "/admin/entregas-epi",
    icon: Package,
    module: "Empresa",
    requiredPermissions: ["epi-deliver"],
    allowedRoles: ["company_admin", "safety_technician", "administrator"],
  },
  {
    label: "Trocas de EPI",
    href: "/admin/trocas-epi",
    icon: Wrench,
    module: "Empresa",
    requiredPermissions: ["epi-exchange-review"],
    allowedRoles: ["company_admin", "safety_technician", "administrator"],
  },
  {
    label: "Atividades de Risco",
    href: "/admin/atividades",
    icon: ClipboardCheck,
    module: "Empresa",
    requiredPermissions: ["risk-manage"],
    allowedRoles: ["company_admin", "safety_technician"],
  },
  {
    label: "Permissões de Trabalho",
    href: "/admin/permissoes-trabalho",
    icon: FileSignature,
    module: "Empresa",
    requiredPermissions: ["pt-create"],
    allowedRoles: ["company_admin", "safety_technician", "administrator"],
  },

  // === COLABORADOR (todos os usuários para suas próprias coisas) ===
  {
    label: "Início",
    href: "/colaborador",
    icon: LayoutDashboard,
    module: "Colaborador",
    // Sem requiredPermissions - todos podem acessar
  },
  {
    label: "Meus EPIs",
    href: "/colaborador/meus-epis",
    icon: HardHat,
    module: "Colaborador",
    // Sem requiredPermissions - todos podem ver seus próprios EPIs
  },
  {
    label: "Solicitar Troca",
    href: "/colaborador/trocas-epi",
    icon: Wrench,
    module: "Colaborador",
    // Sem requiredPermissions - todos podem solicitar troca dos próprios EPIs
  },
  {
    label: "Notificações",
    href: "/colaborador/notificacoes",
    icon: Bell,
    module: "Colaborador",
    // Sem requiredPermissions - todos podem ver suas notificações
  },
];

export function canAccessItem(
  item: NavItem,
  isSuperadmin: boolean,
  permissions: string[],
  role?: string,
) {
  // Superadmin só vê itens do módulo Superadmin
  if (isSuperadmin && item.module === "Superadmin") {
    return true;
  }

  // Superadmin não vê outros módulos na navegação
  if (isSuperadmin && item.module !== "Superadmin") {
    return false;
  }

  // Item exclusivo de superadmin
  if (item.superadminOnly) {
    return false;
  }

  // Módulo Colaborador - acessível por todos (para suas próprias coisas)
  if (item.module === "Colaborador") {
    // Se não tem permissões requeridas, todos podem acessar
    if (!item.requiredPermissions?.length) {
      return true;
    }
    // Se tem permissões requeridas, verificar
    return item.requiredPermissions.every((permission) => permissions.includes(permission));
  }

  // Verificar role permitido para módulo Empresa
  if (item.module === "Empresa" && item.allowedRoles) {
    if (!role || !item.allowedRoles.includes(role as "company_admin" | "safety_technician" | "administrator" | "employee")) {
      return false;
    }
  }

  // Verificar permissões
  if (item.requiredPermissions?.length) {
    return item.requiredPermissions.every((permission) => permissions.includes(permission));
  }

  return true;
}

export function can(permission: AppPermission, isSuperadmin: boolean, permissions: string[]) {
  return isSuperadmin || permissions.includes(permission);
}

// Determina para qual módulo redirecionar após login
export function getDefaultRoute(isSuperadmin: boolean, role: string): string {
  if (isSuperadmin) {
    return "/admin";
  }

  switch (role) {
    case "company_admin":
    case "safety_technician":
    case "administrator":
      return "/admin";
    case "employee":
    default:
      return "/colaborador";
  }
}
