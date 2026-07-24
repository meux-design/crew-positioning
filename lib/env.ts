import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  SEATS_AERO_API_KEY: z.string().min(1).optional(),
  SEATS_AERO_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  NEXT_PUBLIC_APP_MODE: z.enum(["demo", "production"]).default("demo"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
});

export const env = envSchema.parse(process.env);

export const isDemoMode = env.NEXT_PUBLIC_APP_MODE === "demo" || !env.SEATS_AERO_API_KEY;
