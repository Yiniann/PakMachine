import { NextFunction, Request, Response } from "express";
import { checkClientBaseReleaseToken } from "../services/clientBaseStorageConfigService";

export const authenticateClientBaseRelease = (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    const supplied = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
    const result = checkClientBaseReleaseToken(supplied);
    if (!result.configured) {
      return res.status(503).json({ error: "客户端基础包发布服务尚未配置" });
    }
    if (!result.valid) {
      return res.status(401).json({ error: "基础包发布凭证无效" });
    }
    next();
  } catch (error) {
    const status = Number((error as Error & { status?: number })?.status || 0);
    if (status >= 400 && status <= 599) return res.status(status).json({ error: (error as Error).message });
    next(error);
  }
};
