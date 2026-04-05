-- Fix stack depth recursion caused by app_users RLS policies calling helper
-- functions that also read app_users.

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.app_users
  where auth_user_id = auth.uid()
    and is_active = true
  limit 1;
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select is_superadmin
      from public.app_users
      where auth_user_id = auth.uid()
        and is_active = true
      limit 1
    ),
    false
  );
$$;

create or replace function public.company_access(company uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select is_superadmin or company_id = company
      from public.app_users
      where auth_user_id = auth.uid()
        and is_active = true
      limit 1
    ),
    false
  );
$$;
