# 🎯 GUIA RÁPIDO: Sistema de Métricas e Módulos

## 📍 Localização das Coisas

### Estrutura de Módulos
```
modules/
├── superadmin/        👑 Super Admin (SaaS)
├── company/          🏢 Tenant/Empresa
├── employee/         👤 Colaborador
└── shared/           🔄 Compartilhado
```

### Página de Métricas (Super Admin)
```
/admin/metricas
├── Dashboard (KPIs)
├── Access Logs (logins/logouts)
├── Action Logs (CRUD de usuários)
└── User Activity (atividade por usuário)
```

### Código de Logging
```
lib/logger/
├── system-logger.ts          (class principal)
├── index.ts                  (singleton + exports)
├── use-logger.ts             (hook React)
├── server-action-logger.ts   (wrapper para actions)
├── README.md                 (como usar)
└── INTEGRATION_EXAMPLES.md   (exemplos práticos)
```

---

## 🚀 Começar a Usar

### 1️⃣ Em uma Server Action (recomendado)

```typescript
"use server";
import { withLogging } from "@/lib/logger";

export async function deleteEpi(epiId: string) {
  return withLogging(
    async () => {
      const supabase = await createSupabaseServerClient();
      await supabase.from("epis").delete().eq("id", epiId);
    },
    {
      action: "delete",
      entityType: "epi",
      entityId: epiId,
      description: `EPI ${epiId} deleted`,
    }
  );
}
```

### 2️⃣ Em um Componente React

```typescript
"use client";
import { useLogger } from "@/lib/logger";
import { useSession } from "@/lib/auth/hooks"; // ou seu auth hook

export function MyComponent() {
  const session = useSession();
  const { logAction } = useLogger({
    userId: session?.user.id,
    companyId: session?.user.company_id,
  });

  async function handleApprove(permissionId: string) {
    await logAction({
      action: "approve",
      entityType: "work_permit",
      entityId: permissionId,
      description: "Work permit approved",
    });
  }

  return <button onClick={() => handleApprove("123")}>Aprovar</button>;
}
```

### 3️⃣ Verificar Logs no Dashboard

1. Ir para `/admin/metricas`
2. Ver resumo geral (KPIs)
3. Clique em "Log de Ações" para ver detalhes
4. Use filtros para buscar

---

## 📊 Métricas Disponíveis

### Dashboard Overview
- ✅ Logins Hoje
- ✅ Ações Hoje
- ✅ Usuários Ativos (7 dias)
- ✅ Usuários Inativos (30 dias)

### Access Logs (quem entrou quando)
- Filtros: Ação (login/logout), Usuário
- Info: IP, Navegador, SO, Dispositivo

### Action Logs (o que foi feito)
- Filtros: Ação, Tipo de entidade, Status
- Detalhes: Valores antes/depois, erro se falhou

### User Activity (atividade total)
- Total de logins/ações por usuário
- Último acesso e logout
- Alerta visual de inatividade

---

## 🔐 Segurança & RLS

| Quem | Vê Quê |
|-----|--------|
| **Superadmin** | Tudo (todos os logs) |
| **Company Admin** | Logs da sua empresa |
| **Colaborador** | Apenas seus próprios logs |

---

## 📋 Checklist para Integração

Para cada action que quer logar:

- [ ] Adicionar `withLogging()` wrapper
- [ ] Especificar action type (create/read/update/delete/etc)
- [ ] Especificar entity_type (epi/user/company/etc)
- [ ] Testar em desenvolvimento
- [ ] Verificar em `/admin/metricas`

---

## ❓ Exemplos Mais Completos

Veja: `lib/logger/INTEGRATION_EXAMPLES.md`

---

## 🆘 Troubleshooting

### "Nenhum registro encontrado" na página de métricas
- ✅ Verifique se a migration foi executada
- ✅ Faça login/logout para gerar logs
- ✅ Aguarde alguns segundos para sincronizar

### Erro de permissão ao acessar `/admin/metricas`
- ✅ Verifique se seu usuário tem `is_superadmin = true`
- ✅ Verifique RLS policies no Supabase

### Hook `useLogger` não funciona
- ✅ Use apenas em componentes com `"use client"`
- ✅ Certifique-se de passar userId e companyId

---

## 📞 Próximos Passos

1. Integrar logging em actions existentes (ver INTEGRATION_EXAMPLES.md)
2. Criar middleware para auto-logging de page access
3. Gerar relatórios/exportar logs
4. Completar migração de módulos (gradualmente)

---

**Dúvidas?** Veja `lib/logger/README.md` para documentação completa.
