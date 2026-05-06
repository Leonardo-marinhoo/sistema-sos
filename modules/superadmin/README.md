# Super Admin Module

## Responsabilidades
- Gerenciar empresas (tenants)
- Monitorar atividades do sistema
- Acessar métricas e logs
- Gerenciar usuários super admin
- Configurações globais do SaaS

## Estrutura
```
superadmin/
├── components/
│   ├── metrics/
│   │   ├── access-logs.tsx
│   │   ├── action-logs.tsx
│   │   ├── user-activity.tsx
│   │   ├── dashboard-overview.tsx
│   │   └── metrics-filters.tsx
│   ├── management/
│   │   ├── companies-list.tsx
│   │   └── superadmin-users.tsx
│   └── shared/
├── lib/
│   ├── api.ts - API calls
│   ├── hooks.ts - React hooks
│   └── utils.ts - Utilities
├── layout.tsx
└── pages/
    ├── page.tsx
    ├── metricas/
    ├── empresas/
    └── usuarios-superadmin/
```

## Isolamento
- Importações apenas de `modules/superadmin` e `shared`
- Nunca importar de `modules/company` ou `modules/employee`
- Use tipos do `shared` ou defina localmente

## Access Control
- Somente usuários com `is_superadmin = true` podem acessar este módulo
- Middleware deve validar em `app/(protected)/admin`
