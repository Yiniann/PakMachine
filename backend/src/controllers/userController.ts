import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../lib/prisma";
import { loadSettings } from "./systemSettingsController";
import { buildResetUrl, sendPasswordResetEmail } from "../services/mailService";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const TOKEN_EXPIRES_HOURS = 1;

// Basic validators to keep payloads sane before touching the database
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPassword = (pwd: string) => typeof pwd === "string" && pwd.length >= 8;


export const listUsers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { id: "asc" } });
    const safe = users.map(
      ({ password: _pw, resetToken, resetTokenExpires, ...rest }: typeof users[number]) => rest,
    );
    res.json(safe);
  } catch (error) {
    next(error);
  }
};

export const adminCreateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, role = "user" } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Email format is invalid" });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: { email, password: hashed, role },
    });
    const { password: _pw, resetToken, resetTokenExpires, ...rest } = created;
    res.status(201).json(rest);
  } catch (error) {
    next(error);
  }
};

export const adminDeleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    await prisma.user.delete({ where: { id } });
    res.json({ message: "User deleted" });
  } catch (error) {
    next(error);
  }
};

export const adminUpdateRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, role } = req.body ?? {};
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    if (!role || (role !== "user" && role !== "admin")) {
      return res.status(400).json({ error: "Role must be 'user' or 'admin'" });
    }

    await prisma.user.update({ where: { email }, data: { role: role as "user" | "admin" } });
    res.json({ message: "Role updated" });
  } catch (error) {
    next(error);
  }
};

export const adminResetSiteName = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body ?? {};
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await prisma.user.update({ where: { email }, data: { siteName: null } });
    res.json({ message: "Site name reset, user needs to set it again on next login" });
  } catch (error) {
    next(error);
  }
};

export const adminUpdatePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, newPassword } = req.body ?? {};
    if (!email || !newPassword) {
      return res.status(400).json({ error: "Email and newPassword are required" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Email format is invalid" });
    }
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { email }, data: { password: hashed } });
    res.json({ message: "Password updated" });
  } catch (error) {
    next(error);
  }
};

export const adminResetBuildQuota = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body ?? {};
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    await prisma.user.update({
      where: { email },
      data: { buildQuotaUsed: 0, buildQuotaDate: null } as any,
    });
    res.json({ message: "构建次数已重置" });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sys = loadSettings();
    if (sys.allowRegister === false) {
      return res.status(403).json({ error: "注册已关闭" });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Email format is invalid" });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashed } });
    const { password: _pw, resetToken, resetTokenExpires, ...rest } = user;

    res.status(201).json(rest);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userCtx = (req as any).user;
    if (!userCtx?.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { currentPassword, newPassword } = req.body ?? {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "缺少当前密码或新密码" });
    }
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ error: "密码长度至少 8 位" });
    }
    const user = await prisma.user.findUnique({ where: { id: Number(userCtx.sub) } });
    if (!user) {
      return res.status(404).json({ error: "用户不存在" });
    }
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return res.status(401).json({ error: "当前密码不正确" });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    res.json({ message: "密码已更新" });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    const { password: _pw, resetToken, resetTokenExpires, ...rest } = user;

    res.json({ token, user: rest });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body ?? {};
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Email format is invalid" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Avoid leaking whether the email exists.
      return res.status(200).json({ message: "If that email exists, a reset link has been generated" });
    }

    const token = crypto.randomBytes(24).toString("hex");
    const expires = new Date(Date.now() + TOKEN_EXPIRES_HOURS * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpires: expires },
    });

    const resetUrl = buildResetUrl(token);

    const sendResult = await sendPasswordResetEmail({
      to: email,
      resetUrl,
      token,
      expiresAt: expires,
    });

    const payload: Record<string, unknown> = {
      message: "If that email exists, a reset link has been generated",
      expiresAt: expires,
      resetUrl,
      emailSent: sendResult.sent,
    };

    // Return the raw token for local/dev usage; in production links are enough.
    if (process.env.NODE_ENV !== "production") {
      payload.resetToken = token;
    }

    res.json(payload);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and newPassword are required" });
    }
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExpires: null },
    });

    res.json({ message: "Password updated" });
  } catch (error) {
    next(error);
  }
};
