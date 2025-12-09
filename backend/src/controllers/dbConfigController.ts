import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { reloadPrisma, testDatabaseConnection } from "../lib/prisma";

const envPath = path.resolve(__dirname, "../../.env");

export const saveDatabaseUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const databaseUrl = (req.body as any)?.databaseUrl;
    if (!databaseUrl || typeof databaseUrl !== "string") {
      return res.status(400).json({ error: "缺少 databaseUrl" });
    }
    // 先校验连接可用，避免保存错误配置
    await testDatabaseConnection(databaseUrl);
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
    await reloadPrisma(databaseUrl);
    res.json({ success: true, needRestart: false });
  } catch (err) {
    next(err);
  }
};
