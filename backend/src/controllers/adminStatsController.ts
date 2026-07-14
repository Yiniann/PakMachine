import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { getSiteNameLimit } from "../lib/userAccess";

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const getAdminStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const last7DaysStart = new Date(todayStart);
    last7DaysStart.setDate(last7DaysStart.getDate() - 6);

    const [totalUsers, proUsers, paidUsers, totalBuildJobs, buildsToday, buildsLast7Days] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { userType: { in: ["pro", "priority", "subscriber"] } } }),
      prisma.user.findMany({
        where: {
          role: { not: "admin" },
          userType: { in: ["pro", "priority", "subscriber"] },
        },
        select: { role: true, userType: true, siteNameLimit: true },
      }),
      prisma.buildJob.count(),
      prisma.buildJob.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.buildJob.count({ where: { createdAt: { gte: last7DaysStart } } }),
    ]);

    const paidSiteNameLimit = paidUsers.reduce(
      (total, user) => total + getSiteNameLimit(user.role, user.userType, user.siteNameLimit),
      0,
    );

    res.json({
      totalUsers,
      proUsers,
      paidSiteNameLimit,
      totalBuildJobs,
      buildsToday,
      buildsLast7Days,
    });
  } catch (error) {
    next(error);
  }
};
