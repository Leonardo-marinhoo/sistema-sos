# 📦 Guia de Migração Modular (Gradual)

## Visão Geral

A estrutura de módulos foi criada, mas a migração de código existente é **gradual e não-disruptiva**.

```
Antes:
app/(protected)/
├── admin/
├── colaborador/
└── dashboard/

Depois (meta):
app/(protected)/
├── modules/superadmin/        (admin move para cá)
├── modules/company/           (dashboard move para cá)
└── modules/employee/          (colaborador move para cá)
```

---

## Fase 1: Setup (✅ COMPLETO)

- ✅ Pastas de módulos criadas
- ✅ README de cada módulo
- ✅ Lib de logging criada
- ✅ Página de métricas criada
- ✅ Documentação completa

**Status**: Pronto para usar imediatamente!

---

## Fase 2: Integração de Logging (🟡 TODO)

### Passo 1: Actions de Auth

**Arquivo**: `app/actions/auth.ts`

```typescript
// ANTES:
export async function signIn(_prevState, formData) {
  // login logic
}

// DEPOIS:
import { getLogger } from "@/lib/logger";
import { headers } from "next/headers";

export async function signIn(_prevState, formData) {
  const logger = getLogger();
  const headersList = headers();
  
  // login logic...
  
  // Add logging
  if (success) {
    await logger.logAccess({
      userId: authData.user.id,
      action: "login",
      ipAddress: headersList.get("x-forwarded-for") || "unknown",
      userAgent: headersList.get("user-agent") || "",
    });
  }
}
```

### Passo 2: Actions de Admin (epis, users, etc)

Para cada action em:
- `app/(protected)/admin/epis/actions.ts`
- `app/(protected)/admin/usuarios/actions.ts`
- etc.

Adicione `withLogging()`:

```typescript
import { withLogging } from "@/lib/logger";

export async function createEpi(data) {
  return withLogging(
    async () => {
      // existing logic
    },
    {
      action: "create",
      entityType: "epi",
      description: `EPI ${data.name} created`,
    }
  );
}
```

---

## Fase 3: Migração de Componentes (🔴 OPCIONAL)

### Opção A: Não Migrar (Recomendado para MVP)
- Mantenha `app/(protected)/admin` como está
- Use `modules/` apenas para **novo código**
- Gradualmente refatore quando precisar

### Opção B: Migração Gradual
Quando for trabalhar num componente:

1. Mova para `modules/{module}/components/`
2. Atualize imports em todo lugar que usa
3. Teste bem
4. Commit

**Exemplo**: Mover `app/(protected)/admin/epis/columns.tsx`

```
ANTES: app/(protected)/admin/epis/columns.tsx
DEPOIS: modules/superadmin/components/epis/columns.tsx

Importadores antigos:
app/(protected)/admin/epis/page.tsx
```

---

## Fase 4: Reorganização Completa (🔴 LONGO PRAZO)

Se resolver fazer migração completa:

```typescript
// Step 1: Criar novo arquivo
modules/superadmin/pages/epis/page.tsx

// Step 2: Copiar componentes
modules/superadmin/components/epis/

// Step 3: Atualizar imports
- De: @/app/(protected)/admin/...
- Para: @/modules/superadmin/...

// Step 4: Remover antigos
app/(protected)/admin/epis/

// Step 5: Atualizar rotamento (se necessário)
```

---

## 🎯 Recomendação: Implementação Imediata

### Para Usar **AGORA** (sem breaking changes)

1. **Integrar logging em uma action**:
   ```typescript
   // app/actions/auth.ts
   import { withLogging } from "@/lib/logger";
   // Add wrapping ao signIn
   ```

2. **Testai em desenvolvimento**:
   ```bash
   npm run dev
   # Faça login/logout
   # Navegue até /admin/metricas
   ```

3. **Verificar logs**:
   - Login deve aparecer em "Access Logs"
   - Actions devem aparecer em "Action Logs"

4. **Replicar padrão**:
   - Adicione logging em outras actions
   - Use como template para futures

---

## ✅ Checklist de Integração

- [ ] Ler `lib/logger/README.md`
- [ ] Ler `lib/logger/INTEGRATION_EXAMPLES.md`
- [ ] Criar branch: `feature/add-logging-to-auth`
- [ ] Integrar logging em `app/actions/auth.ts`
- [ ] Testar login/logout
- [ ] Verificar em `/admin/metricas`
- [ ] Fazer PR/merge
- [ ] Replicar em outras actions
- [ ] Documentar padrão para team

---

## 📚 Próximas Integrações

Ordem recomendada de logging:

1. **Auth** (login/logout) ✅ Mais importante
2. **EPIs** (CRUD de EPIs)
3. **Trabalhos** (CRUD de atividades)
4. **Permissões** (Approval de PTs)
5. **Trocas de EPI** (Employee requests)
6. **Documentos** (Upload/delete)

---

## 🚨 Cuidados ao Migrar

❌ **NÃO FAÇA**:
- Mover tudo de uma vez (vai quebrar app)
- Remover código antigo sem testar novo
- Esquecer de atualizar imports

✅ **FAÇA**:
- Migre um arquivo por vez
- Teste bem antes de remover antigo
- Use git branches
- Faça commits pequenos

---

## 🔗 Referências

- [lib/logger/README.md](lib/logger/README.md)
- [METRICS_QUICK_START.md](METRICS_QUICK_START.md)
- [modules/superadmin/README.md](modules/superadmin/README.md)
- [lib/logger/INTEGRATION_EXAMPLES.md](lib/logger/INTEGRATION_EXAMPLES.md)

---

## 🎓 Padrão de Isolamento de Módulos

### SuperAdmin
```typescript
// ✅ CORRETO
import { Button } from "@/components/ui/button"; // shared UI
import { getLogger } from "@/lib/logger"; // shared lib
import { MetricsDashboardOverview } from "@/modules/superadmin/components/metrics";

// ❌ ERRADO
import { EmployeeCard } from "@/modules/employee/components"; // não cross-import!
```

### Company
```typescript
// ✅ CORRETO
import { createClient } from "@/lib/supabase/client"; // shared
import { JobForm } from "@/modules/company/components/jobs";

// ❌ ERRADO
import { SuperAdminPanel } from "@/modules/superadmin/components"; // não!
```

---

**Próximo passo**: Integrar logging em `app/actions/auth.ts` 🚀
