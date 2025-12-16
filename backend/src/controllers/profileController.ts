import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";

export const getSiteName = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.sub) return res.status(401).json({ error: "Unauthorized" });
    const dbUser = await prisma.user.findUnique({ where: { id: Number(user.sub) } });
    const siteName = (dbUser as any)?.siteName ?? null;
    res.json({ siteName });
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
    res.json({ siteName: (updated as any)?.siteName || siteName.trim() });
  } catch (err) {
    next(err);
  }
};
