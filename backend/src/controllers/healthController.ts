import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const healthCheck = async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
  } catch (error) {
    console.error("Healthcheck failed", error);
    res.status(500).json({ status: "error" });
  }
};
