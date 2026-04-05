do $$
declare
  v_user_id uuid;
  v_email text := 'super@admin.com.br';
  v_password text := '159123';
begin
  select id
    into v_user_id
    from auth.users
   where email = v_email
   limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(),
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('full_name', 'Super Admin 2'),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      'email',
      v_email,
      now(),
      now(),
      now()
    )
    on conflict (provider, provider_id) do nothing;
  end if;

  update public.app_users
     set full_name = 'Super Admin 2',
         role = 'superadmin',
         is_superadmin = true,
         is_active = true,
         company_id = null,
         updated_at = now()
   where auth_user_id = v_user_id;

  if not found then
    insert into public.app_users (
      auth_user_id,
      email,
      full_name,
      role,
      is_superadmin,
      is_active,
      company_id
    )
    values (
      v_user_id,
      v_email,
      'Super Admin 2',
      'superadmin',
      true,
      true,
      null
    )
    on conflict (auth_user_id) do update
      set role = excluded.role,
          is_superadmin = excluded.is_superadmin,
          is_active = excluded.is_active,
          company_id = excluded.company_id,
          updated_at = now();
  end if;
end;
$$;
