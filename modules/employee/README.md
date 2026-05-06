# Employee Module

## Responsabilidades
- Operações do colaborador
- Trocas de EPI
- Notificações
- Perfil pessoal
- Historico de entregas

## Estrutura
```
employee/
├── components/
│   ├── active-epi-exchanges/
│   ├── notifications/
│   ├── profile/
│   └── shared/
├── lib/
│   ├── api.ts
│   ├── hooks.ts
│   └── utils.ts
├── layout.tsx
└── pages/
    ├── page.tsx
    ├── notificacoes/
    └── trocas-epi/
```

## Isolamento
- Importações apenas de `modules/employee` e `shared`
- Usuários veem apenas seus próprios dados
- Use RLS para segurança

## Access Control
- Role: `employee`
- Acesso restrito ao próprio perfil
- Apenas solicitar trocas, não aprovar
