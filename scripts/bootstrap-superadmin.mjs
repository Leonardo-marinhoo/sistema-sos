import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL ?? "leo.ccodes@gmail.com";
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD ?? "159123";

if (!SUPABASE_URL || !SUPABASE_SECRET) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureDefaultCompany() {
  const DEFAULT_COMPANY_NAME = "SOS Default";
  const DEFAULT_COMPANY_DOCUMENT = "00000000000000";

  const { data: existing, error: findError } = await supabase
    .from("companies")
    .select("id")
    .eq("document_number", DEFAULT_COMPANY_DOCUMENT)
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  if (existing) {
    return existing.id;
  }

  const { data, error } = await supabase
    .from("companies")
    .insert({
      name: DEFAULT_COMPANY_NAME,
      legal_name: "SOS Default LTDA",
      document_number: DEFAULT_COMPANY_DOCUMENT,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("Could not create default company");
  }

  return data.id;
}

async function ensureSuperadminAuthUser() {
  const usersPage = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersPage.error) {
    throw usersPage.error;
  }

  const existing = usersPage.data.users.find(
    (user) => user.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase(),
  );

  if (existing) {
    return existing.id;
  }

  const created = await supabase.auth.admin.createUser({
    email: SUPERADMIN_EMAIL,
    password: SUPERADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: "Super Admin",
    },
  });

  if (created.error || !created.data.user) {
    throw created.error ?? new Error("Could not create superadmin auth user");
  }

  return created.data.user.id;
}

async function ensureAppUser(authUserId) {
  const { error } = await supabase.from("app_users").upsert(
    {
      auth_user_id: authUserId,
      email: SUPERADMIN_EMAIL,
      full_name: "Super Admin",
      role: "superadmin",
      is_superadmin: true,
      company_id: null,
      is_active: true,
    },
    { onConflict: "auth_user_id" },
  );

  if (error) {
    throw error;
  }
}

async function main() {
  console.log("[bootstrap] Starting superadmin bootstrap...");
  await ensureDefaultCompany();
  const authUserId = await ensureSuperadminAuthUser();
  await ensureAppUser(authUserId);
  console.log("[bootstrap] Superadmin ensured:", SUPERADMIN_EMAIL);
}

main().catch((error) => {
  console.error("[bootstrap] Failed:", error.message);
  process.exit(1);
});
