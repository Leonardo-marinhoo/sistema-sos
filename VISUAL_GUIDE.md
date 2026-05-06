# 🎨 Diagrama Visual: Sistema de Métricas

## 🏗️ Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA SOS                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┼─────────┐
                    │         │         │
            ┌───────▼────┐ ┌──▼──────┐ ┌──▼──────┐
            │ SUPERADMIN │ │ COMPANY │ │EMPLOYEE │
            └────────────┘ └─────────┘ └─────────┘
                    │         │         │
                    └────┬────┴────┬────┘
                         │        │
                    ┌────▼────────▼─────┐
                    │   SHARED (lib)    │
                    │  logger, auth     │
                    │  components/ui    │
                    └───────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐     ┌────▼────┐   ┌────▼────┐
    │ Supabase│     │ Supabase│   │ Supabase│
    │Database │     │  Auth   │   │ Storage │
    └─────────┘     └─────────┘   └─────────┘
```

---

## 📊 Fluxo de Logging

```
┌──────────────────────────────────────────────────────────┐
│                   USUÁRIO ACESSANDO SISTEMA              │
└──────────────────────────────────────────────────────────┘
                          │
                 ┌────────▼────────┐
                 │  LOGIN PAGE     │
                 └────────┬────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
    ┌─────────┐    ┌──────────────┐   ┌──────────┐
    │  Email  │    │  PASSWORD    │   │  Device  │
    │         │    │              │   │  Info    │
    └────┬────┘    └──────┬───────┘   └────┬─────┘
         │                │               │
         └────────────────┼───────────────┘
                          │
                    ┌─────▼─────┐
                    │ AUTH.SIGNIN│
                    └─────┬─────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼─────┐      ┌───▼────┐      ┌───▼────┐
    │  SUCCESS │      │ FAILURE│      │ TIMEOUT│
    └────┬─────┘      └───┬────┘      └───┬────┘
         │                │               │
         └────────────────┼───────────────┘
                          │
              ┌───────────▼───────────┐
              │  logger.logAccess()   │
              │  └─ userId            │
              │  └─ action: "login"   │
              │  └─ ipAddress         │
              │  └─ userAgent         │
              └───────────┬───────────┘
                          │
              ┌───────────▼────────────┐
              │  INSERT INTO           │
              │  system_access_logs    │
              └───────────┬────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼────┐    ┌──────▼──────┐  ┌────▼─────┐
    │Trigger: │    │Trigger:     │  │Supervisor│
    │  Auto   │    │Auto update  │  │ LOGS! 📊 │
    │ update  │    │user_activity│  │           │
    │summary  │    │             │  └───────────┘
    └─────────┘    └─────────────┘
```

---

## 🗂️ Estrutura de Módulos

```
SHARED (lib)
├── 🔐 Authentication
│   ├── session.ts
│   ├── permissions.ts
│   └── hooks.ts
│
├── 📝 Logger ⭐ NOVO
│   ├── SystemLogger class
│   ├── useLogger hook
│   └── withLogging wrapper
│
├── 🗄️ Supabase
│   ├── client.ts
│   ├── server.ts
│   └── admin.ts
│
├── 📚 Types
│   ├── app-user
│   ├── company
│   └── ...
│
└── 🎨 Components (UI)
    ├── Button, Input, etc
    └── form-with-toast

─────────────────────────────────────────────────

SUPERADMIN 👑
├── 📊 MÉTRICA DASHBOARD
│   ├── Dashboard Overview (KPIs)
│   ├── Access Logs Table
│   ├── Action Logs Table
│   └── User Activity Table
│
├── 📈 API Functions
│   ├── getAccessLogs()
│   ├── getActionLogs()
│   ├── getUserActivitySummary()
│   ├── getDailyActivitySummary()
│   ├── getMetricsOverview()
│   └── getPageAccessStats()
│
└── 🔑 Gerenciamento
    ├── Empresas
    ├── Usuários Super Admin
    └── Configurações Globais

─────────────────────────────────────────────────

COMPANY 🏢
├── 📦 Gerenciar EPIs
│   ├── EPI List
│   ├── EPI Form
│   └── Histórico
│
├── 👥 Gerenciar Usuários
│   ├── Employee List
│   └── Atribuições
│
├── 🚧 Atividades de Trabalho
│   ├── Cadastro
│   └── Risco
│
└── 📋 Permissões
    ├── Work Permits
    └── Aprovação

─────────────────────────────────────────────────

EMPLOYEE 👤
├── 📱 Dashboard
│   └── Meus EPIs
│
├── 🔄 Trocar EPIs
│   ├── Request Form
│   └── Status
│
├── 📢 Notificações
│   └── Inbox
│
└── 👤 Perfil
    ├── Dados Pessoais
    └── Histórico
```

---

## 📡 Fluxo de Dados: Página de Métricas

```
┌──────────────────────────────────────┐
│  SuperAdmin acessar /admin/metricas  │
└──────────────────┬───────────────────┘
                   │
          ┌────────▼─────────┐
          │ page.tsx carrega │
          └────────┬─────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼

MetricsDashboardOverview
├─ getMetricsOverview()
│  ├─ SELECT COUNT(*) from logins today
│  ├─ SELECT COUNT(*) from actions today
│  ├─ COUNT distinct users last 7 days
│  └─ COUNT inactive users
│
└─ Display 4 Cards ✅

    │              │              │
    ▼              ▼              ▼

AccessLogsTable   ActionLogsTable  UserActivityTable
│                 │                 │
├─ getAccessLogs()│                 │
│ ├─ pagination  │                 │
│ ├─ filters     │                 │
│ └─ render rows │                 │
│                ├─ getActionLogs()│
│                │ ├─ with joins  │
│                │ ├─ expandable  │
│                │ └─ render rows │
│                │                ├─ getUserActivitySummary()
│                │                │ ├─ last 30 days
│                │                │ ├─ inactivity alerts
│                │                │ └─ render rows
│                │                │
└────────────────┴────────────────┴─────► DISPLAY TABLES
```

---

## 🔐 RLS Security Model

```
┌─────────────────────────────────────────┐
│         USER TRIES TO QUERY              │
│  SELECT * FROM system_access_logs       │
└────────────────┬────────────────────────┘
                 │
          ┌──────▼──────┐
          │ RLS POLICY? │
          └──────┬──────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
 IS_SUPERADMIN  COMPANY_ADMIN EMPLOYEE
    │            │            │
    ✅ Allow    ✅ Allow own ⚠️ Deny OR
    │ ALL        company      allow own
    │            ONLY         LOGS ONLY
    ▼            ▼            ▼
[Sees all]  [Sees own co]  [Sees self]
```

---

## 🗄️ Database Tables & Relationships

```
system_access_logs
├── id (PK)
├── user_id (FK) ──────┐
├── action (enum)      │
├── ip_address         │
├── device_type        │
├── browser_name       │
├── created_at         │
└── Indexes: user_id, created_at, action

user_action_logs
├── id (PK)
├── user_id (FK) ──────┐
├── company_id (FK) ─┐ │
├── action           │ │
├── entity_type      │ │
├── entity_id        │ │
├── old_values       │ │
├── new_values       │ │
├── status           │ │
├── error_message    │ │
├── created_at       │ │
└── Indexes: user_id, company_id, created_at, entity_type

page_access_metrics
├── id (PK)
├── user_id (FK) ────┐
├── company_id (FK)  │
├── page_path        │
├── module_type      │
├── duration_seconds │
├── accessed_at      │
└── left_at

daily_activity_summary
├── id (PK)
├── company_id (FK) ──┐
├── date             │
├── total_logins     │
├── active_users     │
├── actions_by_type  │
├── most_active_user │
└── most_accessed_page

user_activity_summary
├── id (PK)
├── user_id (FK) ─────────┐
├── company_id (FK)    ───┤
├── last_login            │
├── last_logout           │
├── total_logins          │
├── total_actions         │
├── days_active_last_30   │
└── last_activity_date

     app_users        companies
     ├── id (PK)      ├── id (PK)
     ├── user_id  ────┘
     ├── company_id ──┐
     ├── email        │
     ├── role         │
     └── ...          │
                      │
                  All FK point back
```

---

## 🔄 Auto-Update Triggers

```
quando INSERT em user_action_logs
        │
        └──► UPDATE user_activity_summary
             ├── INCREMENT total_actions
             └── SET last_activity_date

quando INSERT em system_access_logs
        │
        └──► UPDATE user_activity_summary
             ├── INCREMENT total_logins (if action='login')
             ├── SET last_logout (if action='logout')
             └── SET last_activity_date
```

---

## 📱 Component Hierarchy

```
/admin/metricas
│
├─ Header
│  └─ "Métricas do Sistema"
│
├─ MetricsDashboardOverview
│  ├─ Card (Logins Hoje)
│  ├─ Card (Ações Hoje)
│  ├─ Card (Usuários Ativos 7d)
│  └─ Card (Usuários Inativos 30d)
│
├─ Tabs Navigation
│  │
│  ├─ Tab: "Access Logs"
│  │  ├─ Filters (Action, User)
│  │  └─ AccessLogsTable
│  │     ├─ TableHeader
│  │     └─ TableBody (rows)
│  │
│  ├─ Tab: "Action Logs"
│  │  ├─ Filters (Action, Entity, Status)
│  │  └─ ActionLogsTable
│  │     ├─ TableHeader
│  │     ├─ TableBody (rows)
│  │     └─ ExpandedDetail (old/new values)
│  │
│  └─ Tab: "User Activity"
│     ├─ UserActivityTable
│     ├─ TableHeader
│     └─ TableBody (rows with alerts)
│
└─ Footer
   └─ Pagination Controls
```

---

## 🚀 Deployment Flow

```
Developer Branch
    │
    ├─ Feature: metrics-and-modules
    │  ├─ 4 docs (METRICS_*, MODULES_*, INDEX, PRE_CHECKLIST)
    │  ├─ 1 migration (system_metrics_logging.sql)
    │  ├─ 1 logger lib (6 files)
    │  ├─ 1 module structure (superadmin + others)
    │  ├─ 1 page (/admin/metricas)
    │  └─ 4 components
    │
    ├─ PR Review
    │  ├─ Check migration (no errors)
    │  ├─ Check RLS policies
    │  ├─ Test components
    │  └─ Review types
    │
    └─ Merge to Main
       │
       ├─ Run migration
       ├─ Verify tables exist
       ├─ Test /admin/metricas access
       ├─ Verify RLS works
       └─ Deploy to prod! 🎉
```

---

## 📊 Metrics Captured

```
System Metrics
├─ Total Logins (today, week, month)
├─ Total Logouts (today, week)
├─ Active Users (by period)
├─ Inactive Users (30+ days)
└─ Sessions Duration

Action Metrics
├─ Total Actions (by type)
├─ Failed Actions (with error)
├─ Denied Actions
├─ Top Modified Entities
└─ Average Action Duration

User Metrics
├─ Logins per User
├─ Actions per User
├─ Last Activity Date
├─ Days Active (last 30)
└─ Activity Pattern

Page Metrics
├─ Most Accessed Pages
├─ Module Distribution
├─ Time Spent per Page
└─ Navigation Patterns
```

---

**🎯 Visual summary complete! See [INDEX.md](INDEX.md) for navigation.**
