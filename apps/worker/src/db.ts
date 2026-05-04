import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  workerPrisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.workerPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.workerPrisma = db;
