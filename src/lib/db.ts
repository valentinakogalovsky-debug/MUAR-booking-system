import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

let prisma: PrismaClient | undefined;

export function getDb(): PrismaClient {
  if (prisma) return prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      options: "-c timezone=UTC",
    }),
  });

  return prisma;
}
