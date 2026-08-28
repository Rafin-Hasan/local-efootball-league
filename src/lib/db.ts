import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const createClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: ReturnType<typeof createClient> | undefined;
}

export const db = globalThis.prismaGlobal ?? createClient();

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = db;
