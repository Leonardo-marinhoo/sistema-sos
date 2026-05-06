-- Fix summary counters for first login/action and use correct timestamps
create schema if not exists internal;

create or replace function internal.update_user_activity_summary()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	insert into public.user_activity_summary (user_id, company_id, last_activity_date, total_actions)
	values (new.user_id, new.company_id, new.created_at::date, 1)
	on conflict (user_id) do update set
		last_activity_date = new.created_at::date,
		total_actions = user_activity_summary.total_actions + 1,
		updated_at = now();
	return new;
exception when others then
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
	insert into public.user_activity_summary (
		user_id,
		company_id,
		last_login,
		last_logout,
		total_logins,
		last_activity_date
	)
	values (
		new.user_id,
		(select company_id from public.app_users where id = new.user_id),
		case when new.action = 'login' then new.created_at else null end,
		case when new.action = 'logout' then new.created_at else null end,
		case when new.action = 'login' then 1 else 0 end,
		new.created_at::date
	)
	on conflict (user_id) do update set
		last_login = case when new.action = 'login' then new.created_at else user_activity_summary.last_login end,
		last_logout = case when new.action = 'logout' then new.created_at else user_activity_summary.last_logout end,
		total_logins = case when new.action = 'login' then user_activity_summary.total_logins + 1 else user_activity_summary.total_logins end,
		last_activity_date = new.created_at::date,
		updated_at = now();
	return new;
exception when others then
	return new;
end;
$$;
