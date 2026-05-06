-- Add missing column used by page metrics logging
alter table public.page_access_metrics
	add column if not exists user_agent text;

-- Internal schema for security-definer trigger helpers
create schema if not exists internal;

create or replace function internal.update_user_activity_summary()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	insert into public.user_activity_summary (user_id, company_id, last_activity_date)
	values (new.user_id, new.company_id, new.created_at::date)
	on conflict (user_id) do update set
		last_activity_date = new.created_at::date,
		total_actions = user_activity_summary.total_actions + 1,
		updated_at = now();
	return new;
exception when others then
	-- Avoid blocking log inserts if summary update fails
	return new;
end;
$$;

create or replace function internal.update_user_activity_on_login()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
exception when others then
	-- Avoid blocking log inserts if summary update fails
	return new;
end;
$$;

drop trigger if exists trg_update_user_activity_on_action_log on public.user_action_logs;
create trigger trg_update_user_activity_on_action_log
after insert on public.user_action_logs
for each row
execute function internal.update_user_activity_summary();

drop trigger if exists trg_update_user_activity_on_access_log on public.system_access_logs;
create trigger trg_update_user_activity_on_access_log
after insert on public.system_access_logs
for each row
execute function internal.update_user_activity_on_login();

revoke all on function internal.update_user_activity_summary() from public;
revoke all on function internal.update_user_activity_on_login() from public;
