import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";

const parseFrontendOrigins = (value: unknown): string[] => {
  if (!value || typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  } catch {
    return [];
  }
};

const normalizeFrontendOrigin = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) {
    throw Object.assign(new Error("前端域名不能为空"), { statusCode: 400 });
  }
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw Object.assign(new Error("前端域名格式不正确"), { statusCode: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw Object.assign(new Error("前端域名必须以 http:// 或 https:// 开头"), { statusCode: 400 });
  }
  return parsed.origin;
};

export const getSiteName = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.sub) return res.status(401).json({ error: "Unauthorized" });
    const dbUser = await prisma.user.findUnique({ where: { id: Number(user.sub) } });
    const siteName = (dbUser as any)?.siteName ?? null;
    const frontendOrigins = parseFrontendOrigins((dbUser as any)?.frontendOriginsJson);
    res.json({ siteName, frontendOrigins });
  } catch (err) {
    next(err);
  }
};

export const setSiteName = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.sub) return res.status(401).json({ error: "Unauthorized" });
    const { siteName } = req.body ?? {};
    if (!siteName || typeof siteName !== "string" || !siteName.trim()) {
      return res.status(400).json({ error: "站点名称不能为空" });
    }
    const existing = await prisma.user.findUnique({ where: { id: Number(user.sub) } });
    const isAdmin = (existing as any)?.role === "admin";
    const current = (existing as any)?.siteName;
    if (current && !isAdmin) {
      return res.status(409).json({ error: "站点名称已设置，不能修改" });
    }
    const updated = await prisma.user.update({
      where: { id: Number(user.sub) },
      data: { siteName: siteName.trim() } as any,
    });
    res.json({
      siteName: (updated as any)?.siteName || siteName.trim(),
      frontendOrigins: parseFrontendOrigins((updated as any)?.frontendOriginsJson),
    });
  } catch (err) {
    next(err);
  }
};

export const addFrontendOrigin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.sub) return res.status(401).json({ error: "Unauthorized" });

    const frontendOrigin = normalizeFrontendOrigin(req.body?.frontendOrigin);
    const existing = await prisma.user.findUnique({ where: { id: Number(user.sub) } });
    if (!existing) {
      return res.status(404).json({ error: "用户不存在" });
    }

    const currentOrigins = parseFrontendOrigins((existing as any)?.frontendOriginsJson);
    if (currentOrigins.includes(frontendOrigin)) {
      return res.status(409).json({ error: "该前端域名已绑定" });
    }
    if (currentOrigins.length >= 4) {
      return res.status(400).json({ error: "最多只能绑定 4 个前端域名" });
    }

    const updated = await prisma.user.update({
      where: { id: Number(user.sub) },
      data: { frontendOriginsJson: JSON.stringify([...currentOrigins, frontendOrigin]) } as any,
    });

    res.json({
      frontendOrigins: parseFrontendOrigins((updated as any)?.frontendOriginsJson),
    });
  } catch (err) {
    if ((err as any)?.statusCode) {
      return res.status((err as any).statusCode).json({ error: (err as Error).message });
    }
    next(err);
  }
};
