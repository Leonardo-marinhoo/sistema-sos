export const EMPLOYEE_WITH_COMPANY_AND_JOB_SELECT =
  "id,full_name,role,photo_url,company_id,job_id,companies(name),job:jobs!app_users_job_id_fkey(name)";

export const APP_USER_LIST_WITH_COMPANY_AND_JOB_SELECT =
  "id,full_name,email,role,photo_url,is_active,company_id,job_id,companies(name),job:jobs!app_users_job_id_fkey(name),created_at";

export const APP_USER_DETAIL_WITH_COMPANY_AND_JOB_SELECT =
  "id,full_name,email,role,photo_url,is_active,is_superadmin,company_id,job_id,companies(name),job:jobs!app_users_job_id_fkey(name),created_at,updated_at";

export const APP_USER_EDIT_WITH_COMPANY_AND_JOB_SELECT =
  "id,full_name,email,role,photo_url,is_active,is_superadmin,company_id,job_id,companies(name),job:jobs!app_users_job_id_fkey(name)";