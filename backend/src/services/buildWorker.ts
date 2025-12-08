import { PrismaClient } from "@prisma/client";
import { buildTemplate } from "./buildService";

const prisma = new PrismaClient();
let working = false;

export const startBuildWorker = (intervalMs = 2000) => {
  setInterval(async () => {
    if (working) return;
    working = true;
    try {
      const job = await prisma.buildJob.findFirst({
        where: { status: "pending" },
        orderBy: { createdAt: "asc" },
      });
      if (!job) {
        working = false;
        return;
      }

      await prisma.buildJob.update({ where: { id: job.id }, data: { status: "running", message: null } });

      try {
        const payload = await buildTemplate(prisma, job.userId, job.filename, job.envJson);
        await prisma.buildJob.update({
          where: { id: job.id },
          data: { status: "success", artifactId: payload.artifactId, message: "构建完成" },
        });
      } catch (err: any) {
        await prisma.buildJob.update({
          where: { id: job.id },
          data: { status: "failed", message: err?.message || "构建失败" },
        });
      }
    } finally {
      working = false;
    }
  }, intervalMs);
};
