import { Request, Response, NextFunction } from "express";
import prisma, { reloadPrisma, testDatabaseConnection } from "../lib/prisma";
import bcrypt from "bcryptjs";
import { loadSettings, saveSettings, isInitialized, SystemSettings } from "./systemSettingsController";
import fs from "fs";
import path from "path";

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
  databaseUrl?: string;
};

const envPath = path.resolve(__dirname, "../../.env");

const upsertDatabaseUrl = (databaseUrl: string) => {
  const lines: string[] = [];
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of raw) {
      if (line.trim().startsWith("DATABASE_URL=")) continue;
      if (line.trim() === "") continue;
      lines.push(line);
    }
  }
  lines.push(`DATABASE_URL=${databaseUrl}`);
  fs.writeFileSync(envPath, lines.join("\n") + "\n", "utf8");
};

export const initializeSystem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (isInitialized()) {
      return res.status(400).json({ error: "系统已初始化" });
    }
    const { email, password, siteName, allowRegister, databaseUrl } = (req.body || {}) as InitPayload;
    if (databaseUrl) {
      // 先验证连接可用再落盘并热重载 Prisma
      await testDatabaseConnection(databaseUrl);
      upsertDatabaseUrl(databaseUrl);
      await reloadPrisma(databaseUrl);
    }
    await testDatabaseConnection();
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
