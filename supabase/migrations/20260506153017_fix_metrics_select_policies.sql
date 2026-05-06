-- Fix SELECT policies for metrics tables (auth.uid vs app_users.id)

-- system_access_logs
drop policy if exists "superadmin_view_all_access_logs" on public.system_access_logs;
drop policy if exists "users_view_own_access_logs" on public.system_access_logs;

create policy "superadmin_view_all_access_logs" on public.system_access_logs
	for select using (public.is_superadmin());

create policy "users_view_own_access_logs" on public.system_access_logs
	for select using (user_id = public.current_app_user_id());

-- user_action_logs
drop policy if exists "superadmin_view_all_action_logs" on public.user_action_logs;
drop policy if exists "company_admin_view_own_company_logs" on public.user_action_logs;
drop policy if exists "users_view_own_action_logs" on public.user_action_logs;

create policy "superadmin_view_all_action_logs" on public.user_action_logs
	for select using (public.is_superadmin());

create policy "company_admin_view_own_company_logs" on public.user_action_logs
	for select using (public.company_access(company_id));

create policy "users_view_own_action_logs" on public.user_action_logs
	for select using (user_id = public.current_app_user_id());

-- page_access_metrics
drop policy if exists "superadmin_view_all_page_metrics" on public.page_access_metrics;
drop policy if exists "company_admin_view_own_company_metrics" on public.page_access_metrics;

create policy "superadmin_view_all_page_metrics" on public.page_access_metrics
	for select using (public.is_superadmin());

create policy "company_admin_view_own_company_metrics" on public.page_access_metrics
	for select using (public.company_access(company_id));

-- daily_activity_summary
drop policy if exists "superadmin_view_daily_summary" on public.daily_activity_summary;
drop policy if exists "company_admin_view_own_summary" on public.daily_activity_summary;

create policy "superadmin_view_daily_summary" on public.daily_activity_summary
	for select using (public.is_superadmin());

create policy "company_admin_view_own_summary" on public.daily_activity_summary
	for select using (public.company_access(company_id));

-- user_activity_summary
drop policy if exists "superadmin_view_all_user_summary" on public.user_activity_summary;
drop policy if exists "users_view_own_summary" on public.user_activity_summary;

create policy "superadmin_view_all_user_summary" on public.user_activity_summary
	for select using (public.is_superadmin());

create policy "users_view_own_summary" on public.user_activity_summary
	for select using (user_id = public.current_app_user_id());
