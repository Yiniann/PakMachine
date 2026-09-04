import { NextFunction, Request, Response } from "express";
import prisma from "../lib/prisma";
import { hashSecret } from "../services/clientManifestService";

export const authenticateClientBff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "BFF 实例未认证" });
    const token = header.slice("Bearer ".length);
    if (token.length < 32 || token.length > 256) return res.status(401).json({ error: "BFF 实例未认证" });
    const instance = await prisma.clientBffInstance.findUnique({ where: { accessTokenHash: hashSecret(token) } });
    if (!instance || instance.status !== "active") return res.status(401).json({ error: "BFF 实例未认证或已停用" });
    if (!instance.siteId) return res.status(401).json({ error: "BFF 实例尚未绑定品牌，请重新激活" });
    (req as any).clientBffInstance = instance;
    await prisma.clientBffInstance.update({ where: { id: instance.id }, data: { lastSeenAt: new Date() } });
    next();
  } catch (error) {
    next(error);
  }
};
