import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";
import { loadSettings, saveSettings, isInitialized, SystemSettings } from "./systemSettingsController";

export const checkInitialized = (_req: Request, res: Response, next: NextFunction) => {
  try {
    const inited = isInitialized();
    res.json({ initialized: inited });
  } catch (err) {
    next(err);
  }
};

type InitPayload = {
  email?: string;
  password?: string;
  siteName?: string;
  allowRegister?: boolean;
};

export const initializeSystem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (isInitialized()) {
      return res.status(400).json({ error: "系统已初始化" });
    }
    const { email, password, siteName, allowRegister } = (req.body || {}) as InitPayload;
    if (!email || !password) {
      return res.status(400).json({ error: "缺少 email 或 password" });
    }
    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        role: "admin",
        siteName: siteName || null,
      },
    });

    const current = loadSettings();
    const merged: SystemSettings = {
      ...current,
      siteName: siteName ?? current.siteName,
      allowRegister: allowRegister ?? current.allowRegister,
      initialized: true,
    };
    saveSettings(merged);

    res.json({ success: true, adminId: user.id });
  } catch (err) {
    next(err);
  }
};
