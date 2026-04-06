alter table public.work_permits
  add column if not exists employee_signature_data_url text,
  add column if not exists technician_signature_data_url text;

update public.work_permits
set employee_signature_data_url = employee_signature_url
where employee_signature_data_url is null
  and employee_signature_url is not null;

update public.work_permits
set technician_signature_data_url = technician_signature_url
where technician_signature_data_url is null
  and technician_signature_url is not null;

alter table public.work_permits
  drop column if exists employee_signature_url,
  drop column if exists technician_signature_url,
  drop column if exists employee_photo_url,
  drop column if exists technician_photo_url;

alter table public.app_users
  add column if not exists photo_url text;
