import type { Config } from "drizzle-kit";

export default {
  dialect: "postgresql",
  schema: [
    "./src/lib/server/db/*-schema.ts",
  ],
  out: "./drizzle",
  dbCredentials: {
    url: process.env.SUPABASE_POOL_URL || "",
  },
} satisfies Config;