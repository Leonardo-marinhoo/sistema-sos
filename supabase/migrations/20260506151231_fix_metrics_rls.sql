-- Allow trigger-driven summary updates under RLS
drop policy if exists "system_insert_user_activity_summary" on public.user_activity_summary;
drop policy if exists "system_update_user_activity_summary" on public.user_activity_summary;

create policy "system_insert_user_activity_summary" on public.user_activity_summary
	for insert with check (true);

create policy "system_update_user_activity_summary" on public.user_activity_summary
	for update using (true) with check (true);
