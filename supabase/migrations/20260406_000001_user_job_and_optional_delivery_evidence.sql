alter table public.app_users
  add column if not exists job_id uuid references public.jobs(id) on delete set null;

create index if not exists idx_app_users_job_id on public.app_users(job_id);

alter table public.epi_deliveries
  alter column signature_file_url drop not null,
  alter column photo_file_url drop not null;