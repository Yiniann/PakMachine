import { NextFunction, Request, Response } from "express";
import { loadSettings, saveSettings } from "./systemSettingsController";
import {
  clientBffBuildEnvironment,
  clientSigningPublicConfig,
  initializeClientSigningIdentity,
  normalizeClientControlBaseUrl,
} from "../services/clientSigningIdentityService";

export const getClientSigningConfig = (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = loadSettings();
    return res.json(clientSigningPublicConfig(settings.clientControlBaseUrl));
  } catch (error) {
    next(error);
  }
};

export const initializeClientSigningConfig = (req: Request, res: Response, next: NextFunction) => {
  try {
    const controlBaseUrl = normalizeClientControlBaseUrl(req.body?.controlBaseUrl);
    const current = loadSettings();
    saveSettings({ ...current, clientControlBaseUrl: controlBaseUrl });
    initializeClientSigningIdentity();
    return res.status(201).json(clientSigningPublicConfig(controlBaseUrl));
  } catch (error) {
    if (error instanceof Error && !((error as Error & { status?: number }).status)) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

export const getClientBffBuildEnvironment = (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = loadSettings();
    return res.json(clientBffBuildEnvironment(settings.clientControlBaseUrl));
  } catch (error) {
    const status = Number((error as Error & { status?: number })?.status);
    if (status >= 400 && status < 600) {
      return res.status(status).json({ error: (error as Error).message });
    }
    next(error);
  }
};
