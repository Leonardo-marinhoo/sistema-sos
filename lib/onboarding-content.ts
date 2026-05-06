import {
  Bell,
  Building2,
  ClipboardCheck,
  FileSignature,
  HardHat,
  PackageCheck,
  ShieldCheck,
  UserCog,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type LoginOnboardingStep = {
  title: string;
  description: string;
};

export const loginOnboardingSteps: LoginOnboardingStep[] = [
  {
    title: "O que é o Sistema SOS",
    description:
      "Uma plataforma simples para organizar empresas, usuários, EPIs, trocas e permissões de trabalho.",
  },
  {
    title: "Entre com seu acesso",
    description:
      "Cada pessoa vê apenas o que precisa: SaaS, gestão da empresa, técnico de segurança ou colaborador.",
  },
  {
    title: "Siga o roteiro da sua função",
    description:
      "Depois do login, o sistema mostra os primeiros passos corretos para o seu perfil.",
  },
];

export type RoleOnboardingKey =
  | "superadmin"
  | "company_admin"
  | "safety_technician"
  | "employee";

export type RoleOnboardingStep = {
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: LucideIcon;
};

export type RoleOnboarding = {
  title: string;
  subtitle: string;
  badge: string;
  icon: LucideIcon;
  steps: RoleOnboardingStep[];
};

export const roleOnboarding: Record<RoleOnboardingKey, RoleOnboarding> = {
  superadmin: {
    title: "Primeiros passos do Superadmin",
    subtitle: "Configure uma empresa cliente e entregue o acesso inicial.",
    badge: "Administração SaaS",
    icon: ShieldCheck,
    steps: [
      {
        title: "Cadastre uma empresa",
        description: "Crie o cliente que vai usar o sistema.",
        href: "/admin/empresas/nova",
        cta: "Cadastrar empresa",
        icon: Building2,
      },
      {
        title: "Vincule responsáveis",
        description: "Crie o admin que vai cuidar da empresa.",
        href: "/admin/usuarios/novo",
        cta: "Criar usuário",
        icon: UserCog,
      },
      {
        title: "Acompanhe a operação",
        description: "Veja métricas, empresas e usuários ativos.",
        href: "/admin/metricas",
        cta: "Ver métricas",
        icon: ClipboardCheck,
      },
    ],
  },
  company_admin: {
    title: "Primeiros passos da empresa",
    subtitle: "Monte a base mínima antes de operar EPIs e permissões.",
    badge: "Gestão da Empresa",
    icon: Building2,
    steps: [
      {
        title: "Configure cargos",
        description: "Crie os cargos antes dos usuários, pois cada usuário precisa estar vinculado a uma função.",
        href: "/admin/cargos/novo",
        cta: "Criar cargo",
        icon: ShieldCheck,
      },
      {
        title: "Cadastre usuários",
        description: "Inclua colaboradores, técnicos e administradores vinculando cada pessoa ao cargo correto.",
        href: "/admin/usuarios/novo",
        cta: "Cadastrar usuário",
        icon: UsersRound,
      },
      {
        title: "Comece pelos EPIs",
        description: "Cadastre equipamentos e registre entregas.",
        href: "/admin/epis/novo",
        cta: "Cadastrar EPI",
        icon: PackageCheck,
      },
    ],
  },
  safety_technician: {
    title: "Primeiros passos do Técnico",
    subtitle: "Execute a rotina de segurança com registros simples.",
    badge: "Segurança do Trabalho",
    icon: HardHat,
    steps: [
      {
        title: "Confira os EPIs",
        description: "Verifique os equipamentos antes das entregas.",
        href: "/admin/epis",
        cta: "Ver EPIs",
        icon: HardHat,
      },
      {
        title: "Registre entregas",
        description: "Associe cada EPI ao colaborador correto.",
        href: "/admin/entregas-epi/novo",
        cta: "Nova entrega",
        icon: PackageCheck,
      },
      {
        title: "Controle riscos",
        description: "Cadastre atividades e permissões de trabalho.",
        href: "/admin/permissoes-trabalho/novo",
        cta: "Criar permissão",
        icon: FileSignature,
      },
    ],
  },
  employee: {
    title: "Primeiros passos do Colaborador",
    subtitle: "Use sua área para acompanhar EPIs e avisar quando algo precisar de troca.",
    badge: "Minha Área",
    icon: UsersRound,
    steps: [
      {
        title: "Veja seus EPIs",
        description: "Confira os equipamentos registrados para você.",
        href: "/colaborador/meus-epis",
        cta: "Ver EPIs",
        icon: HardHat,
      },
      {
        title: "Solicite troca",
        description: "Peça substituição quando um EPI estiver danificado.",
        href: "/colaborador/trocas-epi",
        cta: "Solicitar troca",
        icon: Wrench,
      },
      {
        title: "Leia notificações",
        description: "Acompanhe comunicados importantes da empresa.",
        href: "/colaborador/notificacoes",
        cta: "Ver avisos",
        icon: Bell,
      },
    ],
  },
};
