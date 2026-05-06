-- System Metrics and Logging Schema
-- This migration creates all tables needed for monitoring system activity

-- 1. System Access Logs (login/logout tracking)
create table if not exists public.system_access_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  action text not null check (action in ('login', 'logout', 'session_timeout')),
  ip_address text,
  user_agent text,
  device_type text, -- 'web', 'mobile', 'tablet'
  browser_name text,
  browser_version text,
  os_name text,
  os_version text,
  created_at timestamptz not null default now()
);

-- 2. User Action Logs (track all CRUD operations)
create table if not exists public.user_action_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  action text not null, -- 'create', 'read', 'update', 'delete', 'export', 'download', 'approve', etc
  entity_type text not null, -- 'epi', 'work_permit', 'user', 'company', etc
  entity_id uuid,
  old_values jsonb, -- previous values for update operations
  new_values jsonb, -- new values for create/update operations
  description text,
  ip_address text,
  user_agent text,
  status text not null default 'success' check (status in ('success', 'failure', 'denied')),
  error_message text,
  created_at timestamptz not null default now(),
  duration_ms integer -- optional: time taken for operation
);

-- 3. Page Access Metrics (track page views and session time)
create table if not exists public.page_access_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  page_path text not null, -- e.g., '/admin/epis', '/colaborador/trocas-epi'
  module_type text not null check (module_type in ('superadmin', 'company', 'employee', 'login')),
  duration_seconds integer, -- time spent on page
  ip_address text,
  accessed_at timestamptz not null default now(),
  left_at timestamptz
);

-- 4. Daily Activity Summary (aggregated metrics for performance)
create table if not exists public.daily_activity_summary (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  date date not null,
  total_logins integer not null default 0,
  total_logouts integer not null default 0,
  active_users integer not null default 0,
  total_actions integer not null default 0,
  actions_by_type jsonb, -- {'create': 45, 'update': 30, 'delete': 5, ...}
  most_active_user_id uuid references public.app_users(id),
  most_accessed_page text,
  unique (company_id, date),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. User Activity Summary (aggregate per user)
create table if not exists public.user_activity_summary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  last_login timestamptz,
  last_logout timestamptz,
  total_logins integer not null default 0,
  total_actions integer not null default 0,
  days_active_last_30 integer not null default 0,
  last_activity_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- 6. Audit Log (comprehensive audit trail for compliance)
-- Note: This table may already exist, so we just ensure consistency
-- create table if not exists public.audit_logs (
--   id uuid primary key default gen_random_uuid(),
--   company_id uuid references public.companies(id),
--   actor_user_id uuid references public.app_users(id),
--   action text not null,
--   entity text not null,
--   entity_id uuid not null,
--   old_data jsonb,
--   new_data jsonb,
--   created_at timestamptz not null default now()
-- );

-- INDEXES for performance
create index if not exists idx_system_access_logs_user_id on public.system_access_logs(user_id);
create index if not exists idx_system_access_logs_created_at on public.system_access_logs(created_at);
create index if not exists idx_system_access_logs_action on public.system_access_logs(action);

create index if not exists idx_user_action_logs_user_id on public.user_action_logs(user_id);
create index if not exists idx_user_action_logs_company_id on public.user_action_logs(company_id);
create index if not exists idx_user_action_logs_created_at on public.user_action_logs(created_at);
create index if not exists idx_user_action_logs_entity_type on public.user_action_logs(entity_type);
create index if not exists idx_user_action_logs_action on public.user_action_logs(action);
create index if not exists idx_user_action_logs_status on public.user_action_logs(status);

create index if not exists idx_page_access_metrics_user_id on public.page_access_metrics(user_id);
create index if not exists idx_page_access_metrics_company_id on public.page_access_metrics(company_id);
create index if not exists idx_page_access_metrics_accessed_at on public.page_access_metrics(accessed_at);
create index if not exists idx_page_access_metrics_page_path on public.page_access_metrics(page_path);
create index if not exists idx_page_access_metrics_module_type on public.page_access_metrics(module_type);

create index if not exists idx_daily_activity_summary_company_id on public.daily_activity_summary(company_id);
create index if not exists idx_daily_activity_summary_date on public.daily_activity_summary(date);

create index if not exists idx_user_activity_summary_company_id on public.user_activity_summary(company_id);
create index if not exists idx_user_activity_summary_last_activity_date on public.user_activity_summary(last_activity_date);

-- RLS: Only superadmin can view all metrics, users can view only their own access logs
alter table public.system_access_logs enable row level security;
alter table public.user_action_logs enable row level security;
alter table public.page_access_metrics enable row level security;
alter table public.daily_activity_summary enable row level security;
alter table public.user_activity_summary enable row level security;

-- POLICIES: System Access Logs
create policy "superadmin_view_all_access_logs" on public.system_access_logs
  for select using (
    exists (select 1 from public.app_users where id = auth.uid() and is_superadmin = true)
  );

create policy "users_view_own_access_logs" on public.system_access_logs
  for select using (
    auth.uid()::text = user_id::text
  );

create policy "system_insert_access_logs" on public.system_access_logs
  for insert with check (true);

-- POLICIES: User Action Logs
create policy "superadmin_view_all_action_logs" on public.user_action_logs
  for select using (
    exists (select 1 from public.app_users where id = auth.uid() and is_superadmin = true)
  );

create policy "company_admin_view_own_company_logs" on public.user_action_logs
  for select using (
    exists (
      select 1 from public.app_users au
      where au.id = auth.uid()
      and au.role = 'company_admin'
      and au.company_id = user_action_logs.company_id
    )
  );

create policy "users_view_own_action_logs" on public.user_action_logs
  for select using (
    auth.uid()::text = user_id::text
  );

create policy "system_insert_action_logs" on public.user_action_logs
  for insert with check (true);

-- POLICIES: Page Access Metrics
create policy "superadmin_view_all_page_metrics" on public.page_access_metrics
  for select using (
    exists (select 1 from public.app_users where id = auth.uid() and is_superadmin = true)
  );

create policy "company_admin_view_own_company_metrics" on public.page_access_metrics
  for select using (
    exists (
      select 1 from public.app_users au
      where au.id = auth.uid()
      and au.role = 'company_admin'
      and au.company_id = page_access_metrics.company_id
    )
  );

create policy "system_insert_page_metrics" on public.page_access_metrics
  for insert with check (true);

-- POLICIES: Daily Activity Summary
create policy "superadmin_view_daily_summary" on public.daily_activity_summary
  for select using (
    exists (select 1 from public.app_users where id = auth.uid() and is_superadmin = true)
  );

create policy "company_admin_view_own_summary" on public.daily_activity_summary
  for select using (
    exists (
      select 1 from public.app_users au
      where au.id = auth.uid()
      and au.role = 'company_admin'
      and au.company_id = daily_activity_summary.company_id
    )
  );

-- POLICIES: User Activity Summary
create policy "superadmin_view_all_user_summary" on public.user_activity_summary
  for select using (
    exists (select 1 from public.app_users where id = auth.uid() and is_superadmin = true)
  );

create policy "users_view_own_summary" on public.user_activity_summary
  for select using (
    auth.uid()::text = user_id::text
  );

-- FUNCTIONS: Auto-update user_activity_summary
create or replace function public.update_user_activity_summary()
returns trigger as $$
begin
  insert into public.user_activity_summary (user_id, company_id, last_activity_date)
  values (new.user_id, new.company_id, new.created_at::date)
  on conflict (user_id) do update set
    last_activity_date = new.created_at::date,
    total_actions = user_activity_summary.total_actions + 1,
    updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_update_user_activity_on_action_log
after insert on public.user_action_logs
for each row
execute function public.update_user_activity_summary();

-- FUNCTIONS: Auto-update system_access_logs activity
create or replace function public.update_user_activity_on_login()
returns trigger as $$
begin
  insert into public.user_activity_summary (user_id, company_id, last_login, last_activity_date)
  values (new.user_id, (select company_id from public.app_users where id = new.user_id), new.created_at, new.created_at::date)
  on conflict (user_id) do update set
    last_login = new.created_at,
    total_logins = case when new.action = 'login' then user_activity_summary.total_logins + 1 else user_activity_summary.total_logins end,
    last_logout = case when new.action = 'logout' then new.created_at else user_activity_summary.last_logout end,
    last_activity_date = new.created_at::date,
    updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_update_user_activity_on_access_log
after insert on public.system_access_logs
for each row
execute function public.update_user_activity_on_login();
