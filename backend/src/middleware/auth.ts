import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.substring("Bearer ".length);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    (req as any).user = payload;
    next();
  } catch (error) {
    console.error("JWT verify failed", error);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.sub) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const dbUser = await prisma.user.findUnique({ where: { id: Number(user.sub) }, select: { role: true } });
    if (!dbUser || dbUser.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    (req as any).user = { ...user, role: dbUser.role };
    next();
  } catch (error) {
    next(error);
  }
};
