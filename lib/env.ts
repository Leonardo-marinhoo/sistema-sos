import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  SUPERADMIN_EMAIL: z.string().email(),
  SUPERADMIN_PASSWORD: z.string().min(6),
});

const env = serverEnvSchema.safeParse(process.env);

if (!env.success) {
  throw new Error(
    `Invalid environment variables: ${JSON.stringify(env.error.flatten().fieldErrors)}`,
  );
}

export const serverEnv = env.data;
