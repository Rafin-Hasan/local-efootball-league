import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    /*
     * The CLI resolves this the moment the config loads, including for
     * `prisma generate` — which never opens a connection. `postinstall` runs
     * generate, so requiring a real value here made `npm install` fail on a
     * fresh clone before .env could exist.
     *
     * The placeholder only ever satisfies that load. Anything that actually
     * talks to a database (migrate, studio, seed) still fails loudly on
     * connect when DATABASE_URL is unset, which is the correct outcome.
     *
     * `||` rather than `??` on purpose: an empty string is a misconfiguration,
     * not a value, and `??` would pass it straight through to Prisma as a real
     * URL — which is how a blank Vercel variable became "Connection url is
     * empty" instead of anything actionable.
     */
    url:
      process.env.DATABASE_URL?.trim() ||
      "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
