import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const getAdminStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const last7DaysStart = new Date(todayStart);
    last7DaysStart.setDate(last7DaysStart.getDate() - 6);

    const [totalUsers, subscriberUsers, totalBuildJobs, buildsToday, buildsLast7Days] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { userType: "subscriber" } }),
      prisma.buildJob.count(),
      prisma.buildJob.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.buildJob.count({ where: { createdAt: { gte: last7DaysStart } } }),
    ]);

    res.json({
      totalUsers,
      subscriberUsers,
      totalBuildJobs,
      buildsToday,
      buildsLast7Days,
    });
  } catch (error) {
    next(error);
  }
};
