import crypto, { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";
import prisma from "../lib/prisma";
import {
  getClientBaseArtifact,
  normalizeClientBaseArtifactPlatform,
  publishClientBaseArtifact,
} from "../services/clientBaseArtifactService";
import { loadSettings } from "./systemSettingsController";
import {
  createClientBaseArtifactDownloadUrl,
  createClientRuntimeArtifactDownloadUrl,
} from "../services/clientR2Service";
import {
  getClientRuntimeArtifact,
  normalizeClientRuntimeArchitecture,
  publishClientRuntimeArtifact,
} from "../services/clientRuntimeArtifactService";
import {
  createClientRuntimeDeploymentPackage,
  normalizeAdminPathPrefix,
} from "../services/clientRuntimePackageService";
import { clientBffBuildEnvironment } from "../services/clientSigningIdentityService";
import {
  ClientManifestPlatform,
  createSignedClientManifest,
  fetchHttpsSha256,
  hashSecret,
  normalizeBootstrapPublicProfile,
  normalizeGatewayBaseUrls,
  normalizeManifestPublicKey,
} from "../services/clientManifestService";

const PLATFORMS = new Set<ClientManifestPlatform>(["macos", "windows", "android"]);

const loadClientBrands = async (userId: number, readyOnly = false) => {
  const sites = await prisma.userSite.findMany({
    where: { userId, clientBuildEnabled: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const identities = await prisma.clientAppConfig.findMany({ where: { userId } });
  const bySite = new Map(identities.filter((entry) => entry.siteId).map((entry) => [entry.siteId, entry]));
  const brands = sites.map((site) => {
    const identity = bySite.get(site.id);
    return {
      id: site.id,
      name: site.name,
      appId: identity?.appId || null,
      publisher: identity?.publisher || site.name,
      iconUrl: identity?.iconUrl || null,
      ready: Boolean(identity?.appId),
    };
  });
  return readyOnly ? brands.filter((brand) => brand.ready) : brands;
};

export const createClientBffActivation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number((req as any).user?.sub);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const enabledSites = await prisma.userSite.count({ where: { userId, clientBuildEnabled: true } });
    if (enabledSites < 1) return res.status(403).json({ error: "当前没有已开通客户端构建权限的品牌" });
    const token = crypto.randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await prisma.clientBffActivation.create({
      data: { id: randomUUID(), userId, tokenHash: hashSecret(token), expiresAt },
    });
    res.setHeader("Cache-Control", "no-store");
    return res.status(201).json({ activationToken: token, expiresAt: expiresAt.toISOString() });
  } catch (error) {
    next(error);
  }
};

export const enrollClientBff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activationToken = String(req.body?.activationToken || "");
    if (activationToken.length < 32 || activationToken.length > 256) return res.status(400).json({ error: "激活凭证不合法" });
    let instancePublicKey: string;
    let bootstrapPublicProfileBase64: string;
    try {
      instancePublicKey = normalizeManifestPublicKey(req.body?.instancePublicKey);
      bootstrapPublicProfileBase64 = normalizeBootstrapPublicProfile(req.body?.bootstrapPublicProfileBase64);
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }
    const activation = await prisma.clientBffActivation.findUnique({ where: { tokenHash: hashSecret(activationToken) } });
    if (!activation || activation.consumedAt || activation.expiresAt <= new Date()) {
      return res.status(401).json({ error: "激活凭证无效、已使用或已过期" });
    }
    const accessToken = crypto.randomBytes(48).toString("base64url");
    const instanceId = randomUUID();
    const name = typeof req.body?.name === "string" ? req.body.name.trim().slice(0, 80) : "";
    await prisma.$transaction([
      prisma.clientBffActivation.update({ where: { id: activation.id }, data: { consumedAt: new Date() } }),
      prisma.clientBffInstance.create({
        data: {
          id: instanceId,
          userId: activation.userId,
          name: name || null,
          publicKey: instancePublicKey,
          bootstrapPublicProfileBase64,
          accessTokenHash: hashSecret(accessToken),
          lastSeenAt: new Date(),
        },
      }),
    ]);
    res.setHeader("Cache-Control", "no-store");
    return res.status(201).json({ instanceId, accessToken });
  } catch (error) {
    next(error);
  }
};

export const listClientBffBrands = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const instance = (req as any).clientBffInstance;
    return res.json({
      instanceId: instance.id,
      brands: await loadClientBrands(instance.userId, true),
    });
  } catch (error) {
    next(error);
  }
};

export const listClientBrands = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number((req as any).user?.sub);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    return res.json({ brands: await loadClientBrands(userId) });
  } catch (error) {
    next(error);
  }
};

export const saveClientBrandIdentity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number((req as any).user?.sub);
    const siteId = Number(req.params.siteId);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!Number.isSafeInteger(siteId) || siteId < 1) return res.status(400).json({ error: "品牌不合法" });
    const site = await prisma.userSite.findFirst({ where: { id: siteId, userId } });
    if (!site) return res.status(404).json({ error: "品牌不存在" });
    if (!site.clientBuildEnabled) return res.status(403).json({ error: "该品牌尚未开通客户端构建权限" });
    const publisher = typeof req.body?.publisher === "string" ? req.body.publisher.trim() : "";
    if (!publisher || publisher.length > 80 || /[\u0000-\u001f]/.test(publisher)) {
      return res.status(400).json({ error: "发布者需要填写 1 到 80 个可打印字符" });
    }
    if (req.body?.iconUrl !== undefined && req.body?.iconUrl !== null && typeof req.body.iconUrl !== "string") {
      return res.status(400).json({ error: "应用图标 URL 格式不正确" });
    }
    const requestedIconUrl = typeof req.body?.iconUrl === "string" ? req.body.iconUrl.trim() : "";
    let icon: Awaited<ReturnType<typeof fetchHttpsSha256>> | null = null;
    if (requestedIconUrl) {
      try {
        icon = await fetchHttpsSha256(requestedIconUrl);
      } catch (error) {
        return res.status(400).json({ error: (error as Error).message });
      }
    }
    const brandKey = `site:${site.id}`;
    const existing = await prisma.clientAppConfig.findUnique({ where: { userId_brandKey: { userId, brandKey } } });
    const identity = existing
      ? await prisma.clientAppConfig.update({
          where: { id: existing.id },
          data: { siteId: site.id, brandNameSnapshot: site.name, publisher, iconUrl: icon?.url || null },
        })
      : await prisma.clientAppConfig.create({
          data: {
            userId,
            siteId: site.id,
            brandKey,
            brandNameSnapshot: site.name,
            appId: `com.shuttle.client.c${randomUUID().replace(/-/g, "")}`,
            publisher,
            iconUrl: icon?.url || null,
          },
        });
    return res.json({
      siteId: site.id,
      appId: identity.appId,
      publisher: identity.publisher,
      iconUrl: identity.iconUrl,
      iconSha256: icon?.sha256 || null,
    });
  } catch (error) {
    next(error);
  }
};

export const registerClientBaseArtifact = (req: Request, res: Response, next: NextFunction) => {
  try {
    const platform = normalizeClientBaseArtifactPlatform(req.params.platform);
    const artifact = publishClientBaseArtifact(platform, req.body);
    res.setHeader("Cache-Control", "no-store");
    return res.status(201).json({ artifact });
  } catch (error) {
    const status = Number((error as Error & { status?: number })?.status || 0);
    if (status >= 400 && status <= 599) return res.status(status).json({ error: (error as Error).message });
    next(error);
  }
};

export const registerClientRuntimeArtifact = (req: Request, res: Response, next: NextFunction) => {
  try {
    const architecture = normalizeClientRuntimeArchitecture(req.params.architecture);
    const artifact = publishClientRuntimeArtifact(architecture, req.body);
    res.setHeader("Cache-Control", "no-store");
    return res.status(201).json({ artifact });
  } catch (error) {
    const status = Number((error as Error & { status?: number })?.status || 0);
    if (status >= 400 && status <= 599) return res.status(status).json({ error: (error as Error).message });
    next(error);
  }
};

export const getClientRuntimeConfig = (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.setHeader("Cache-Control", "no-store");
    return res.json(clientBffBuildEnvironment(loadSettings().clientControlBaseUrl));
  } catch (error) {
    const status = Number((error as Error & { status?: number })?.status || 0);
    if (status >= 400 && status <= 599) return res.status(status).json({ error: (error as Error).message });
    next(error);
  }
};

export const createClientRuntimePackage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number((req as any).user?.sub);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const keys = req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? Object.keys(req.body)
      : [];
    if (keys.some((key) => !["adminPathPrefix", "architecture"].includes(key))) {
      return res.status(400).json({ error: "部署包配置包含不支持的字段" });
    }
    const enabledSites = await prisma.userSite.count({ where: { userId, clientBuildEnabled: true } });
    if (enabledSites < 1) return res.status(403).json({ error: "当前没有已开通客户端构建权限的品牌" });

    const architecture = normalizeClientRuntimeArchitecture(req.body?.architecture);
    const adminPathPrefix = normalizeAdminPathPrefix(req.body?.adminPathPrefix);
    const artifact = getClientRuntimeArtifact(architecture);
    const runtimeDownload = await createClientRuntimeArtifactDownloadUrl(artifact.objectKey, artifact.filename);
    const deployment = createClientRuntimeDeploymentPackage({
      artifact,
      runtimeDownloadUrl: runtimeDownload.url,
      runtimeDownloadExpiresAt: runtimeDownload.expiresAt,
      adminPathPrefix,
    });

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(deployment);
  } catch (error) {
    const status = Number((error as Error & { status?: number })?.status || 0);
    if (status >= 400 && status <= 599) return res.status(status).json({ error: (error as Error).message });
    next(error);
  }
};

export const issueClientBuildManifest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const instance = (req as any).clientBffInstance;
    const siteId = Number(req.body?.brandId);
    const platform = String(req.body?.platform || "") as ClientManifestPlatform;
    if (!Number.isSafeInteger(siteId) || siteId < 1) return res.status(400).json({ error: "brandId 不合法" });
    if (!PLATFORMS.has(platform)) return res.status(400).json({ error: "platform 必须是 macos、windows 或 android" });
    let gatewayBaseUrls: string[];
    try {
      gatewayBaseUrls = normalizeGatewayBaseUrls(req.body?.gatewayBaseUrls);
    } catch (error) {
      return res.status(400).json({ error: (error as Error).message });
    }
    const site = await prisma.userSite.findFirst({ where: { id: siteId, userId: instance.userId } });
    if (!site) return res.status(404).json({ error: "品牌不存在" });
    if (!site.clientBuildEnabled) return res.status(403).json({ error: "该品牌尚未开通客户端构建权限" });
    const identity = await prisma.clientAppConfig.findUnique({
      where: { userId_brandKey: { userId: instance.userId, brandKey: `site:${site.id}` } },
    });
    if (!identity) return res.status(409).json({ error: "请先在 ShuttleITS 完善该品牌的客户端资料" });

    const [icon, artifact] = await Promise.all([
      identity.iconUrl ? fetchHttpsSha256(identity.iconUrl) : Promise.resolve(null),
      Promise.resolve(getClientBaseArtifact(platform)),
    ]);
    const artifactDownload = await createClientBaseArtifactDownloadUrl(artifact.objectKey, artifact.filename);
    const issuedAt = Date.now();
    const expiresAt = issuedAt + 10 * 60 * 1000;
    const buildId = randomUUID();
    const signed = createSignedClientManifest({
      buildId,
      customerId: `customer:${instance.userId}`,
      brandId: `site:${site.id}`,
      configId: identity.appId,
      platform,
      appName: site.name,
      appId: identity.appId,
      publisher: identity.publisher || site.name,
      iconUrl: icon?.url || null,
      iconSha256: icon?.sha256 || null,
      gatewayBaseUrls,
      bootstrapPublicProfileBase64: instance.bootstrapPublicProfileBase64,
      artifact,
      issuedAt,
      expiresAt,
    });
    await prisma.clientBuildManifest.create({
      data: {
        id: buildId,
        userId: instance.userId,
        siteId: site.id,
        instanceId: instance.id,
        platform,
        manifestHash: signed.manifestHash,
        envelopeJson: JSON.stringify(signed.envelope),
        expiresAt: new Date(expiresAt),
      },
    });
    res.setHeader("Cache-Control", "no-store");
    return res.status(201).json({
      buildId,
      manifestHash: signed.manifestHash,
      envelope: signed.envelope,
      baseArtifactUrl: artifactDownload.url,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  } catch (error) {
    const status = Number((error as any)?.status || 0);
    if (status >= 400 && status <= 599) return res.status(status).json({ error: (error as Error).message });
    next(error);
  }
};
