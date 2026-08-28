import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Neon's pooled connection string. Prisma 7 drives migrations through the
    // same URL, so no separate direct URL is configured here.
    url: env("DATABASE_URL"),
  },
});
