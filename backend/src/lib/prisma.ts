import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | null = null;

const createClient = (databaseUrl?: string) => {
  const url = databaseUrl || process.env.DATABASE_URL;
  if (!url) {
    throw Object.assign(new Error("缺少 DATABASE_URL"), { statusCode: 500 });
  }
  return new PrismaClient({ datasourceUrl: url });
};

export const getPrisma = () => {
  if (!prisma) {
    prisma = createClient();
  }
  return prisma;
};

export const reloadPrisma = async (databaseUrl?: string) => {
  const url = databaseUrl || process.env.DATABASE_URL;
  if (!url) {
    throw Object.assign(new Error("缺少 DATABASE_URL"), { statusCode: 500 });
  }
  if (prisma) {
    await prisma.$disconnect();
  }
  process.env.DATABASE_URL = url;
  prisma = createClient(url);
  return prisma;
};

export const testDatabaseConnection = async (databaseUrl?: string) => {
  const client = databaseUrl ? createClient(databaseUrl) : getPrisma();
  try {
    await client.$queryRaw`SELECT 1`;
  } catch (err: any) {
    const message = err?.message || "数据库连接失败";
    throw Object.assign(new Error(message), { statusCode: 500 });
  } finally {
    if (databaseUrl) {
      await client.$disconnect();
    }
  }
};

// Proxy ensures existing imports continue to work while allowing hot reloading.
const prismaProxy: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client: any = getPrisma();
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export default prismaProxy;
