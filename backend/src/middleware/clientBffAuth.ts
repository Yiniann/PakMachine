import { NextFunction, Request, Response } from "express";
import { ClientBffInstance } from "@prisma/client";
import prisma from "../lib/prisma";
import { hashSecret } from "../services/clientManifestService";

type LegacyInstanceBindingDatabase = {
  userSite: {
    findMany: (args: {
      where: { userId: number; clientBuildEnabled: true };
      orderBy: Array<{ createdAt: "asc" } | { id: "asc" }>;
      select: { id: true };
      take: number;
    }) => Promise<Array<{ id: number }>>;
  };
  clientBffInstance: {
    update: (args: {
      where: { id: string };
      data: { siteId: number };
    }) => Promise<ClientBffInstance>;
  };
};

export const bindLegacyClientBffInstance = async (
  instance: ClientBffInstance,
  database: LegacyInstanceBindingDatabase = prisma,
) => {
  if (instance.siteId) return instance;
  const sites = await database.userSite.findMany({
    where: { userId: instance.userId, clientBuildEnabled: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true },
    take: 2,
  });
  if (sites.length !== 1) return null;
  return database.clientBffInstance.update({
    where: { id: instance.id },
    data: { siteId: sites[0].id },
  });
};

export const authenticateClientBff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "BFF 实例未认证" });
    const token = header.slice("Bearer ".length);
    if (token.length < 32 || token.length > 256) return res.status(401).json({ error: "BFF 实例未认证" });
    let instance = await prisma.clientBffInstance.findUnique({ where: { accessTokenHash: hashSecret(token) } });
    if (!instance || instance.status !== "active") return res.status(401).json({ error: "BFF 实例未认证或已停用" });
    if (!instance.siteId) {
      instance = await bindLegacyClientBffInstance(instance);
      if (!instance) return res.status(401).json({ error: "BFF 实例尚未绑定品牌，请重新激活" });
    }
    (req as any).clientBffInstance = instance;
    await prisma.clientBffInstance.update({ where: { id: instance.id }, data: { lastSeenAt: new Date() } });
    next();
  } catch (error) {
    next(error);
  }
};
