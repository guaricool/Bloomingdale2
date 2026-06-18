import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

// Singleton resolution para PrismaClient, necesario en entornos Serverless (ej. Next.js)
// para evitar crear múltiples conexiones durante hot-reloads en desarrollo.

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL no está definido en el entorno.");
  }
  
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({ adapter });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Mantenemos getDb y closeDb como stubs retrocompatibles temporalmente para que 
// las importaciones no fallen mientras refactorizamos, pero lanzarán error si se usan.
export function getDb() {
  throw new Error("getDb() ha sido deprecado. Usa la instancia exportada 'prisma' directamente.");
}

export function closeDb() {
  // Prisma gestiona la desconexión automáticamente en serverless, o puedes llamar a prisma.$disconnect()
}
