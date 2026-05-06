# Company (Tenant) Module

## Responsabilidades
- Gerenciar dados específicos da empresa
- EPIs, Cargos, Atividades de Trabalho
- Permissões de Trabalho (Trabalho)
- Usuários da empresa
- Relatórios internos

## Estrutura
```
company/
├── components/
│   ├── epis/
│   │   ├── epi-list.tsx
│   │   └── epi-form.tsx
│   ├── jobs/
│   ├── activities/
│   ├── work-permits/
│   ├── users/
│   └── shared/
├── lib/
│   ├── api.ts
│   ├── hooks.ts
│   └── utils.ts
├── layout.tsx
└── pages/
```

## Isolamento
- Importações apenas de `modules/company` e `shared`
- Sempre incluir `company_id` em queries
- Use RLS para segurança em nível de banco

## Access Control
- Somente usuários da empresa podem acessar
- Admin da empresa pode gerenciar dados
- Colaboradores veem dados limitados
