create extension if not exists pgcrypto;
create type public.app_role as enum (
  'superadmin',
  'company_admin',
  'safety_technician',
  'employee'
);
create type public.exchange_status as enum ('pending', 'approved', 'rejected');
create type public.pt_status as enum ('draft', 'active', 'expired', 'cancelled');
create type public.risk_severity as enum ('low', 'medium', 'high', 'critical');
create type public.risk_status as enum ('open', 'in_progress', 'closed');
create type public.document_status as enum ('active', 'expired');
create type public.notification_type as enum ('epi_expiry', 'pt_expiry', 'document_expiry', 'system');
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  legal_name text not null,
  document_number text not null unique,
  is_active boolean not null default true,
  created_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  full_name text not null,
  email text not null unique,
  role public.app_role not null default 'employee',
  is_superadmin boolean not null default false,
  is_active boolean not null default true,
  created_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null
);
create table if not exists public.role_permissions (
  role public.app_role not null,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role, permission_id)
);
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  created_by_user_id uuid not null references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);
create table if not exists public.epis (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code text not null,
  name text not null,
  category text not null,
  default_validity_days integer not null check (default_validity_days > 0),
  created_by_user_id uuid not null references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code)
);
create table if not exists public.job_epi_kits (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  epi_id uuid not null references public.epis(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  is_mandatory boolean not null default true,
  version integer not null default 1,
  created_by_user_id uuid not null references public.app_users(id),
  created_at timestamptz not null default now(),
  unique (job_id, epi_id, version)
);
create table if not exists public.epi_deliveries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_user_id uuid not null references public.app_users(id),
  delivered_by_user_id uuid not null references public.app_users(id),
  signature_file_url text not null,
  photo_file_url text not null,
  delivered_at timestamptz not null default now(),
  created_by_user_id uuid not null references public.app_users(id),
  created_at timestamptz not null default now()
);
create table if not exists public.epi_delivery_items (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.epi_deliveries(id) on delete cascade,
  epi_id uuid not null references public.epis(id),
  quantity integer not null check (quantity > 0),
  expires_at date not null,
  unique (delivery_id, epi_id)
);
create table if not exists public.epi_exchange_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_user_id uuid not null references public.app_users(id),
  epi_id uuid not null references public.epis(id),
  reason text not null,
  evidence_photo_url text not null,
  status public.exchange_status not null default 'pending',
  reviewed_by_user_id uuid references public.app_users(id),
  reviewed_at timestamptz,
  created_by_user_id uuid not null references public.app_users(id),
  created_at timestamptz not null default now()
);
create table if not exists public.work_activities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code text not null,
  title text not null,
  nr_reference text not null,
  created_by_user_id uuid not null references public.app_users(id),
  created_at timestamptz not null default now(),
  unique (company_id, code)
);
create table if not exists public.work_permits (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  activity_id uuid not null references public.work_activities(id),
  requested_by_user_id uuid not null references public.app_users(id),
  approved_by_user_id uuid references public.app_users(id),
  employee_signature_url text,
  technician_signature_url text,
  employee_photo_url text,
  technician_photo_url text,
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  status public.pt_status not null default 'draft',
  created_by_user_id uuid not null references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > starts_at)
);
create table if not exists public.work_permit_checklist_items (
  id uuid primary key default gen_random_uuid(),
  permit_id uuid not null references public.work_permits(id) on delete cascade,
  item_text text not null,
  is_checked boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.risk_analyses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  activity_id uuid references public.work_activities(id),
  severity public.risk_severity not null,
  status public.risk_status not null default 'open',
  description text not null,
  mitigation_plan text not null,
  created_by_user_id uuid not null references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.work_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  technician_user_id uuid not null references public.app_users(id),
  title text not null,
  findings text not null,
  correction_plan text not null,
  attachment_url text,
  created_by_user_id uuid not null references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category text not null,
  title text not null,
  file_url text not null,
  responsible_user_id uuid not null references public.app_users(id),
  expires_at date not null,
  status public.document_status not null default 'active',
  created_by_user_id uuid not null references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  recipient_user_id uuid not null references public.app_users(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id),
  actor_user_id uuid references public.app_users(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  result text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create or replace function public.current_app_user_id()
returns uuid
language sql
stable
as $$
  select id from public.app_users where auth_user_id = auth.uid() and is_active = true limit 1;
$$;
create or replace function public.is_superadmin()
returns boolean
language sql
stable
as $$
  select coalesce((select is_superadmin from public.app_users where auth_user_id = auth.uid() and is_active = true limit 1), false);
$$;
create or replace function public.company_access(company uuid)
returns boolean
language sql
stable
as $$
  select
    coalesce(
      (
        select is_superadmin or company_id = company
        from public.app_users
        where auth_user_id = auth.uid() and is_active = true
        limit 1
      ),
      false
    );
$$;
create or replace function public.set_created_by_user()
returns trigger
language plpgsql
as $$
begin
  if new.created_by_user_id is null then
    new.created_by_user_id := public.current_app_user_id();
  end if;
  return new;
end;
$$;
create or replace function public.log_audit_event()
returns trigger
language plpgsql
security definer
as $$
declare
  actor_id uuid;
  target_company uuid;
  entity_uuid uuid;
begin
  actor_id := public.current_app_user_id();

  if TG_OP = 'DELETE' then
    target_company := coalesce(old.company_id, null);
    entity_uuid := old.id;
  else
    target_company := coalesce(new.company_id, null);
    entity_uuid := new.id;
  end if;

  insert into public.audit_logs (company_id, actor_user_id, action, entity, entity_id, result, metadata)
  values (
    target_company,
    actor_id,
    TG_OP,
    TG_TABLE_NAME,
    entity_uuid,
    'success',
    jsonb_build_object('schema', TG_TABLE_SCHEMA)
  );

  if TG_OP = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;
create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.app_users (auth_user_id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'employee'
  )
  on conflict (auth_user_id) do nothing;

  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_auth_user_created();
create trigger trg_companies_updated_at
before update on public.companies
for each row execute procedure public.set_updated_at();
create trigger trg_app_users_updated_at
before update on public.app_users
for each row execute procedure public.set_updated_at();
create trigger trg_jobs_updated_at
before update on public.jobs
for each row execute procedure public.set_updated_at();
create trigger trg_epis_updated_at
before update on public.epis
for each row execute procedure public.set_updated_at();
create trigger trg_work_permits_updated_at
before update on public.work_permits
for each row execute procedure public.set_updated_at();
create trigger trg_risk_analyses_updated_at
before update on public.risk_analyses
for each row execute procedure public.set_updated_at();
create trigger trg_work_reports_updated_at
before update on public.work_reports
for each row execute procedure public.set_updated_at();
create trigger trg_documents_updated_at
before update on public.documents
for each row execute procedure public.set_updated_at();
create trigger trg_companies_created_by
before insert on public.companies
for each row execute procedure public.set_created_by_user();
create trigger trg_app_users_created_by
before insert on public.app_users
for each row execute procedure public.set_created_by_user();
alter table public.companies enable row level security;
alter table public.app_users enable row level security;
alter table public.jobs enable row level security;
alter table public.epis enable row level security;
alter table public.job_epi_kits enable row level security;
alter table public.epi_deliveries enable row level security;
alter table public.epi_exchange_requests enable row level security;
alter table public.work_activities enable row level security;
alter table public.work_permits enable row level security;
alter table public.risk_analyses enable row level security;
alter table public.work_reports enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
create policy companies_superadmin_all on public.companies
for all
using (public.is_superadmin())
with check (public.is_superadmin());
create policy app_users_read_own_or_scope on public.app_users
for select
using (
  auth_user_id = auth.uid()
  or public.is_superadmin()
  or public.company_access(company_id)
);
create policy app_users_manage_superadmin on public.app_users
for all
using (public.is_superadmin())
with check (public.is_superadmin());
create policy tenant_select_jobs on public.jobs
for select
using (public.company_access(company_id));
create policy tenant_write_jobs on public.jobs
for all
using (public.company_access(company_id))
with check (public.company_access(company_id));
create policy tenant_select_epis on public.epis
for select
using (public.company_access(company_id));
create policy tenant_write_epis on public.epis
for all
using (public.company_access(company_id))
with check (public.company_access(company_id));
create policy tenant_select_job_epi_kits on public.job_epi_kits
for select
using (public.company_access(company_id));
create policy tenant_write_job_epi_kits on public.job_epi_kits
for all
using (public.company_access(company_id))
with check (public.company_access(company_id));
create policy tenant_select_epi_deliveries on public.epi_deliveries
for select
using (public.company_access(company_id));
create policy tenant_write_epi_deliveries on public.epi_deliveries
for all
using (public.company_access(company_id))
with check (public.company_access(company_id));
create policy tenant_select_exchange_requests on public.epi_exchange_requests
for select
using (public.company_access(company_id));
create policy tenant_write_exchange_requests on public.epi_exchange_requests
for all
using (public.company_access(company_id))
with check (public.company_access(company_id));
create policy tenant_select_work_activities on public.work_activities
for select
using (public.company_access(company_id));
create policy tenant_write_work_activities on public.work_activities
for all
using (public.company_access(company_id))
with check (public.company_access(company_id));
create policy tenant_select_work_permits on public.work_permits
for select
using (public.company_access(company_id));
create policy tenant_write_work_permits on public.work_permits
for all
using (public.company_access(company_id))
with check (public.company_access(company_id));
create policy tenant_select_risk_analyses on public.risk_analyses
for select
using (public.company_access(company_id));
create policy tenant_write_risk_analyses on public.risk_analyses
for all
using (public.company_access(company_id))
with check (public.company_access(company_id));
create policy tenant_select_work_reports on public.work_reports
for select
using (public.company_access(company_id));
create policy tenant_write_work_reports on public.work_reports
for all
using (public.company_access(company_id))
with check (public.company_access(company_id));
create policy tenant_select_documents on public.documents
for select
using (public.company_access(company_id));
create policy tenant_write_documents on public.documents
for all
using (public.company_access(company_id))
with check (public.company_access(company_id));
create policy notifications_read_scope on public.notifications
for select
using (
  recipient_user_id = public.current_app_user_id()
  or public.is_superadmin()
  or public.company_access(company_id)
);
create policy notifications_update_scope on public.notifications
for update
using (
  recipient_user_id = public.current_app_user_id()
  or public.is_superadmin()
);
create policy audit_read_scope on public.audit_logs
for select
using (public.is_superadmin() or public.company_access(company_id));
create trigger trg_companies_audit
after insert or update or delete on public.companies
for each row execute procedure public.log_audit_event();
create trigger trg_app_users_audit
after insert or update or delete on public.app_users
for each row execute procedure public.log_audit_event();
create trigger trg_jobs_audit
after insert or update or delete on public.jobs
for each row execute procedure public.log_audit_event();
create trigger trg_epis_audit
after insert or update or delete on public.epis
for each row execute procedure public.log_audit_event();
create trigger trg_epi_deliveries_audit
after insert or update or delete on public.epi_deliveries
for each row execute procedure public.log_audit_event();
create trigger trg_exchange_requests_audit
after insert or update or delete on public.epi_exchange_requests
for each row execute procedure public.log_audit_event();
create trigger trg_work_permits_audit
after insert or update or delete on public.work_permits
for each row execute procedure public.log_audit_event();
create trigger trg_risk_analyses_audit
after insert or update or delete on public.risk_analyses
for each row execute procedure public.log_audit_event();
create trigger trg_work_reports_audit
after insert or update or delete on public.work_reports
for each row execute procedure public.log_audit_event();
create trigger trg_documents_audit
after insert or update or delete on public.documents
for each row execute procedure public.log_audit_event();
insert into public.permissions (code, description)
values
  ('user-manage', 'Gerenciar usuarios'),
  ('permission-manage', 'Gerenciar permissoes'),
  ('epi-deliver', 'Registrar entrega de EPI'),
  ('epi-exchange-request', 'Solicitar troca de EPI'),
  ('epi-exchange-review', 'Revisar troca de EPI'),
  ('pt-create', 'Criar permissao de trabalho'),
  ('pt-approve', 'Aprovar permissao de trabalho'),
  ('risk-manage', 'Gerenciar analise de risco'),
  ('report-create', 'Criar relatorios'),
  ('report-read', 'Ler relatorios'),
  ('document-manage', 'Gerenciar documentos'),
  ('notification-read', 'Ler notificacoes')
on conflict (code) do nothing;
insert into public.role_permissions (role, permission_id)
select 'superadmin', id from public.permissions
on conflict do nothing;
insert into public.role_permissions (role, permission_id)
select 'company_admin', id
from public.permissions
where code in ('user-manage', 'epi-deliver', 'epi-exchange-review', 'pt-create', 'pt-approve', 'risk-manage', 'report-create', 'report-read', 'document-manage', 'notification-read')
on conflict do nothing;
insert into public.role_permissions (role, permission_id)
select 'safety_technician', id
from public.permissions
where code in ('epi-deliver', 'epi-exchange-review', 'pt-create', 'pt-approve', 'risk-manage', 'report-create', 'report-read', 'notification-read')
on conflict do nothing;
insert into public.role_permissions (role, permission_id)
select 'employee', id
from public.permissions
where code in ('epi-exchange-request', 'report-read', 'notification-read')
on conflict do nothing;
