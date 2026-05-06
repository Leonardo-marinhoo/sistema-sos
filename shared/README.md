# Shared Module

## Responsabilidades
- Componentes UI reutilizáveis
- Hooks compartilhados
- Tipos TypeScript globais
- Utilitários comuns
- Supabase client

## Estrutura
```
shared/
├── components/
│   ├── ui/        (já existe em /components/ui)
│   └── layouts/   (shared layouts)
├── lib/
│   ├── api.ts     (shared API calls)
│   ├── hooks.ts   (shared React hooks)
│   ├── types.ts   (TypeScript types)
│   └── utils.ts   (utilities)
└── README.md
```

## Importação
- Cada módulo importa do `shared`
- `shared` NUNCA importa dos módulos específicos
- Para tipos específicas, manter em `shared/lib/types.ts`

## Exemplo de uso
```typescript
// Em modules/company/components/
import { Button } from '@/shared/components/ui/button'
import { useSharedHook } from '@/shared/lib/hooks'
import type { AppUser } from '@/shared/lib/types'
```
