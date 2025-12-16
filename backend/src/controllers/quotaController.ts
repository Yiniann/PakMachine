import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";

export const getBuildQuota = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const dbUser: any = await prisma.user.findUnique({
      where: { id: Number(user.sub) },
      select: { buildQuotaUsed: true, buildQuotaDate: true, role: true },
    });
    if (!dbUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (dbUser.role === "admin") {
      const now = new Date();
      return res.json({
        limit: Number.MAX_SAFE_INTEGER,
        used: 0,
        left: Number.MAX_SAFE_INTEGER,
        date: now.toISOString().slice(0, 10),
        unlimited: true,
      });
    }

    const limit = 2;
    const now = new Date();
    const isSameDay = dbUser.buildQuotaDate && new Date(dbUser.buildQuotaDate).toDateString() === now.toDateString();
    const used = isSameDay ? dbUser.buildQuotaUsed || 0 : 0;
    const left = Math.max(limit - used, 0);

    // 如果跨天或日期为空，则顺便重置日期为今天，次数为当前计算值（通常为 0）
    if (!isSameDay) {
      await prisma.user.update({
        where: { id: Number(user.sub) },
        data: { buildQuotaUsed: used, buildQuotaDate: now } as any,
      });
    }

    res.json({
      limit,
      used,
      left,
      date: now.toISOString().slice(0, 10),
    });
  } catch (err) {
    next(err);
  }
};
