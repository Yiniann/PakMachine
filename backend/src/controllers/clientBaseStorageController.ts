import { NextFunction, Request, Response } from "express";
import {
  getClientBaseStoragePublicConfig,
  rotateClientBaseReleaseToken,
  saveClientBaseStorageConfig,
  testClientBaseStorageConnection,
} from "../services/clientBaseStorageConfigService";

export const getClientBaseStorageConfig = (_req: Request, res: Response, next: NextFunction) => {
  try {
    return res.json(getClientBaseStoragePublicConfig());
  } catch (error) {
    next(error);
  }
};

export const updateClientBaseStorageConfig = (req: Request, res: Response, next: NextFunction) => {
  try {
    return res.json(saveClientBaseStorageConfig(req.body));
  } catch (error) {
    return respondServiceError(error, res, next);
  }
};

export const testClientBaseStorage = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    return res.json(await testClientBaseStorageConnection());
  } catch (error) {
    return respondServiceError(error, res, next);
  }
};

export const rotateClientBaseRelease = (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = rotateClientBaseReleaseToken();
    res.setHeader("Cache-Control", "no-store");
    return res.status(201).json({
      releaseToken: result.token,
      createdAt: result.createdAt,
      config: result.config,
    });
  } catch (error) {
    return respondServiceError(error, res, next);
  }
};

function respondServiceError(error: unknown, res: Response, next: NextFunction) {
  const status = Number((error as Error & { status?: number })?.status || 0);
  if (status >= 400 && status <= 599) return res.status(status).json({ error: (error as Error).message });
  return next(error);
}
