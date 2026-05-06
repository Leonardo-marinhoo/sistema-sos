# Sistema de Logging e Métricas

## Visão Geral

O sistema de logging foi implementado para rastrear:
- **Acessos ao sistema** (login/logout)
- **Ações de usuários** (CRUD em qualquer entidade)
- **Acessos a páginas** (tempo gasto, path)
- **Métricas agregadas** (resumo diário de atividades)

### Tabelas do Banco

1. **system_access_logs** - Login/logout e sessões
2. **user_action_logs** - Todas as ações realizadas
3. **page_access_metrics** - Acessos a páginas
4. **daily_activity_summary** - Agregação diária
5. **user_activity_summary** - Resumo por usuário

---

## Como Usar

### 1. Em Server Actions

```typescript
"use server";

import { withLogging } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export async function createEpi(data: CreateEpiInput) {
  return withLogging(
    async () => {
      const supabase = createClient();
      const epi = await supabase.from("epis").insert(data).single();
      return epi;
    },
    {
      action: "create",
      entityType: "epi",
      entityId: epi.id,
      description: `EPI created: ${data.name}`,
    }
  );
}
```

### 2. Em Componentes React

```typescript
"use client";

import { useLogger } from "@/lib/logger";

export function MyComponent() {
  const { logAction } = useLogger({
    userId: currentUser.id,
    companyId: currentUser.company_id,
  });

  async function handleDelete(id: string) {
    await logAction({
      action: "delete",
      entityType: "epi",
      entityId: id,
      description: "EPI deleted by user",
    });
  }

  return <button onClick={() => handleDelete("123")}>Deletar</button>;
}
```

### 3. Logging Manual

```typescript
import { getLogger } from "@/lib/logger";

const logger = getLogger();

await logger.logAccess({
  userId: "user-123",
  action: "login",
  ipAddress: "192.168.1.1",
  userAgent: navigator.userAgent,
});

await logger.logAction({
  userId: "user-123",
  companyId: "company-123",
  action: "update",
  entityType: "work_permit",
  entityId: "permit-123",
  status: "success",
});
```

---

## Acesso às Métricas

### Página de Métricas (Super Admin)
`/admin/metricas`

Mostra:
- Dashboard com KPIs principais
- Log de acessos com filtros
- Log de ações com detalhes
- Atividade de usuários

### Funções da API (em `modules/superadmin/lib/api.ts`)

```typescript
// Acessos
getAccessLogs({ userId?, action?, startDate?, endDate?, limit, offset })

// Ações
getActionLogs({ userId?, entityType?, action?, status?, startDate?, endDate?, limit, offset })

// Atividade de usuários
getUserActivitySummary({ companyId?, limit, offset })

// Resumo diário
getDailyActivitySummary({ companyId?, startDate?, endDate?, limit, offset })

// Overview
getMetricsOverview()

// Acessos a páginas
getPageAccessStats({ startDate?, endDate?, limit })
```

---

## Segurança (RLS)

### Políticas
- **Superadmin**: Acessa todos os logs
- **Company Admin**: Acessa apenas logs da sua empresa
- **Usuários**: Acessam apenas seus próprios logs

---

## Integração Futura

- [ ] Hook de logging automático para navegação de páginas
- [ ] Middleware para rastrear duração de sessões
- [ ] Relatórios semanais por email
- [ ] Exportação de logs em CSV/JSON
- [ ] Gráficos de tendências
- [ ] Alertas de inatividade

---

## Migrations Executadas

```bash
# 1. Criar tabelas e índices
supabase migration up

# 2. Verificar RLS
SELECT * FROM information_schema.table_privileges 
WHERE table_name IN ('system_access_logs', 'user_action_logs', ...);
```
