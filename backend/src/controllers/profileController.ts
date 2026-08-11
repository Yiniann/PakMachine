import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { canBuildSpa, getSiteNameLimit, normalizeUserType } from "../lib/userAccess";

const normalizeFrontendOrigin = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) {
    throw Object.assign(new Error("前端域名不能为空"), { statusCode: 400 });
  }
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw Object.assign(
      new Error("前端域名格式不正确，请输入完整地址并带上协议头，例如 https://demo.com 或 http://demo.com"),
      { statusCode: 400 },
    );
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw Object.assign(
      new Error("前端域名必须以 http:// 或 https:// 开头，例如 https://demo.com"),
      { statusCode: 400 },
    );
  }
  return parsed.origin;
};

const getUserSiteNameLimit = (user: { role?: string | null; userType?: string | null; siteNameLimit?: number | null } | null | undefined) =>
  getSiteNameLimit(user?.role, user?.userType, user?.siteNameLimit);

const getFrontendOriginsLimit = (site: { frontendOriginsLimit?: number | null } | null | undefined) => {
  const parsed = Number(site?.frontendOriginsLimit);
  if (!Number.isFinite(parsed)) return 4;
  const normalized = Math.floor(parsed);
  return normalized >= 1 ? normalized : 4;
};

export const getSiteName = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.sub) return res.status(401).json({ error: "Unauthorized" });
    const dbUser = await prisma.user.findUnique({
      where: { id: Number(user.sub) },
      include: {
        sites: {
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          include: {
            frontendOrigins: {
              orderBy: { createdAt: "asc" },
              include: { frontendOrigin: { select: { origin: true } } },
            },
          },
        },
      },
    });
    const sites = ((dbUser as any)?.sites ?? []).map((site: any) => ({
      id: site.id,
      name: site.name,
      clientBuildEnabled: site.clientBuildEnabled,
      frontendOriginsLimit: getFrontendOriginsLimit(site),
      frontendOrigins: site.frontendOrigins.map((item: any) => item.frontendOrigin.origin),
    }));
    const siteName = sites[0]?.name ?? (dbUser as any)?.siteName ?? null;
    const siteNameLimit = getUserSiteNameLimit(dbUser as any);
    res.json({ siteName, sites, siteNameLimit });
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
    const normalizedUserType = normalizeUserType((existing as any)?.userType);
    if (!canBuildSpa((existing as any)?.role, normalizedUserType)) {
      return res.status(403).json({ error: "当前账号为待开通状态，暂不支持设置站点名" });
    }
    const existingSites = await prisma.userSite.findMany({
      where: { userId: Number(user.sub) },
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    });
    if (existingSites.length > 0 && !isAdmin) {
      return res.status(409).json({ error: "已有站点名称，请前往构建页面切换或新增站点" });
    }
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
      sites: [],
      siteNameLimit: getUserSiteNameLimit(updated as any),
    });
  } catch (err) {
    next(err);
  }
};

export const listUserSites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.sub) return res.status(401).json({ error: "Unauthorized" });
    const existing = await prisma.user.findUnique({ where: { id: Number(user.sub) } });
    const normalizedUserType = normalizeUserType((existing as any)?.userType);
    if (!canBuildSpa((existing as any)?.role, normalizedUserType)) {
      return res.status(403).json({ error: "当前账号暂不支持站点名称管理" });
    }
    const sites = await prisma.userSite.findMany({
      where: { userId: Number(user.sub) },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, name: true, frontendOriginsLimit: true, clientBuildEnabled: true, createdAt: true, updatedAt: true },
    });
    res.json(sites);
  } catch (err) {
    next(err);
  }
};

export const createUserSite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.sub) return res.status(401).json({ error: "Unauthorized" });
    const { name } = req.body ?? {};
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "站点名称不能为空" });
    }
    const existing = await prisma.user.findUnique({ where: { id: Number(user.sub) } });
    const normalizedUserType = normalizeUserType((existing as any)?.userType);
    if (!canBuildSpa((existing as any)?.role, normalizedUserType)) {
      return res.status(403).json({ error: "当前账号暂不支持站点名称管理" });
    }
    const limit = getUserSiteNameLimit(existing as any);
    const currentCount = await prisma.userSite.count({ where: { userId: Number(user.sub) } });
    const legacySiteName = typeof (existing as any)?.siteName === "string" ? (existing as any).siteName.trim() : "";
    const shouldSeedLegacySite = currentCount === 0 && legacySiteName.length > 0 && legacySiteName !== name.trim();
    const effectiveCount = currentCount + (shouldSeedLegacySite ? 1 : 0);
    if (effectiveCount >= limit) {
      return res.status(400).json({ error: `当前账号最多只能添加 ${limit} 个站点名称` });
    }
    const created = await prisma.$transaction(async (tx) => {
      if (shouldSeedLegacySite) {
        await tx.userSite.create({
          data: { userId: Number(user.sub), name: legacySiteName },
        });
      }
      const site = await tx.userSite.create({
        data: { userId: Number(user.sub), name: name.trim() },
        select: { id: true, name: true, frontendOriginsLimit: true, clientBuildEnabled: true, createdAt: true, updatedAt: true },
      });
      if (currentCount === 0) {
        await tx.user.update({
          where: { id: Number(user.sub) },
          data: { siteName: site.name } as any,
        });
      }
      return site;
    });
    res.status(201).json({ ...created, frontendOrigins: [] });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "该站点名称已存在" });
    }
    next(err);
  }
};

export const addFrontendOrigin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.sub) return res.status(401).json({ error: "Unauthorized" });

    const frontendOrigin = normalizeFrontendOrigin(req.body?.frontendOrigin);
    const siteId = Number(req.body?.siteId);
    if (!Number.isInteger(siteId) || siteId < 1) {
      return res.status(400).json({ error: "请选择要绑定域名的品牌" });
    }
    const existing = await prisma.user.findUnique({ where: { id: Number(user.sub) } });
    if (!existing) {
      return res.status(404).json({ error: "用户不存在" });
    }
    const normalizedUserType = normalizeUserType((existing as any)?.userType);
    if (!canBuildSpa((existing as any)?.role, normalizedUserType)) {
      return res.status(403).json({ error: "当前账号为待开通状态，暂不支持绑定前端域名" });
    }

    const site = await prisma.userSite.findFirst({
      where: { id: siteId, userId: existing.id },
      select: { id: true, frontendOriginsLimit: true },
    });
    if (!site) return res.status(404).json({ error: "品牌不存在" });

    await prisma.$transaction(async (tx) => {
      const currentCount = await tx.siteFrontendOrigin.count({ where: { siteId: site.id } });
      const frontendOriginsLimit = getFrontendOriginsLimit(site);
      if (currentCount >= frontendOriginsLimit) {
        throw Object.assign(new Error(`该品牌最多只能绑定 ${frontendOriginsLimit} 个前端域名`), { statusCode: 400 });
      }

      const ownedOrigin = await tx.frontendOrigin.upsert({
        where: { userId_origin: { userId: existing.id, origin: frontendOrigin } },
        update: {},
        create: { userId: existing.id, origin: frontendOrigin },
        select: { id: true },
      });
      const duplicate = await tx.siteFrontendOrigin.findUnique({
        where: { siteId_originId: { siteId: site.id, originId: ownedOrigin.id } },
      });
      if (duplicate) {
        throw Object.assign(new Error("该前端域名已绑定到这个品牌"), { statusCode: 409 });
      }
      await tx.siteFrontendOrigin.create({ data: { siteId: site.id, originId: ownedOrigin.id } });
    });

    const updatedOrigins = await prisma.siteFrontendOrigin.findMany({
      where: { siteId: site.id },
      orderBy: { createdAt: "asc" },
      include: { frontendOrigin: { select: { origin: true } } },
    });

    res.json({
      siteId: site.id,
      frontendOrigins: updatedOrigins.map((item) => item.frontendOrigin.origin),
    });
  } catch (err) {
    if ((err as any)?.statusCode) {
      return res.status((err as any).statusCode).json({ error: (err as Error).message });
    }
    next(err);
  }
};
