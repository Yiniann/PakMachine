import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | null = null;

// 当环境变量未配置时，回退到 Docker 约定的内网地址，减少手工填写
const defaultDatabaseUrl = "mysql://pacmachine:mYeJX4PRx3ykGbiT@mysql:3306/pacmachine";

const resolveDatabaseUrl = (databaseUrl?: string) => {
  const url = databaseUrl || process.env.DATABASE_URL || process.env.DEFAULT_DATABASE_URL || defaultDatabaseUrl;
  if (!url) {
    throw Object.assign(new Error("缺少 DATABASE_URL"), { statusCode: 500 });
  }
  if (!process.env.DATABASE_URL && url === defaultDatabaseUrl) {
    console.warn("[prisma] using built-in default DATABASE_URL (mysql service inside compose)");
  }
  return url;
};

const createClient = (databaseUrl?: string) => {
  const url = resolveDatabaseUrl(databaseUrl);
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
