create or replace function public.log_audit_event()
returns trigger
language plpgsql
security definer
as $$
declare
  actor_id uuid;
  target_company uuid;
  entity_uuid uuid;
  payload jsonb;
begin
  actor_id := public.current_app_user_id();

  if TG_OP = 'DELETE' then
    payload := to_jsonb(old);
  else
    payload := to_jsonb(new);
  end if;

  target_company := nullif(payload->>'company_id', '')::uuid;
  entity_uuid := nullif(payload->>'id', '')::uuid;

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
