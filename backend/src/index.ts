import express, { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get("/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
  } catch (error) {
    console.error("Healthcheck failed", error);
    res.status(500).json({ status: "error" });
  }
});

app.get("/users", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { id: "asc" } });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
