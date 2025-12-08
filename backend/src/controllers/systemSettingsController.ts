import fs from "fs";
import path from "path";
import { Request, Response, NextFunction } from "express";

export type SystemSettings = {
  siteName?: string;
  allowRegister?: boolean;
};

const settingsPath = path.join(__dirname, "../../config/system-settings.json");

export const loadSettings = (): SystemSettings => {
  try {
    const raw = fs.readFileSync(settingsPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return { allowRegister: true };
  }
};

const saveSettings = (settings: SystemSettings) => {
  const dir = path.dirname(settingsPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf8");
};

export const getSystemSettings = (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = loadSettings();
    res.json(settings);
  } catch (err) {
    next(err);
  }
};

export const getPublicSystemSettings = (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { siteName } = loadSettings();
    res.json({ siteName: siteName ?? null });
  } catch (err) {
    next(err);
  }
};

export const updateSystemSettings = (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body as SystemSettings;
    const current = loadSettings();
    const merged = {
      ...current,
      ...payload,
    };
    saveSettings(merged);
    res.json(merged);
  } catch (err) {
    next(err);
  }
};
