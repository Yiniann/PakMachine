import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const TOKEN_EXPIRES_HOURS = 1;

export const listUsers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { id: "asc" } });
    const safe = users.map(({ password: _pw, resetToken, resetTokenExpires, ...rest }) => rest);
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

export const adminUpdatePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, newPassword } = req.body ?? {};
    if (!email || !newPassword) {
      return res.status(400).json({ error: "Email and newPassword are required" });
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

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
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
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(200).json({ message: "If that email exists, a reset link has been generated" });
    }

    const token = crypto.randomBytes(24).toString("hex");
    const expires = new Date(Date.now() + TOKEN_EXPIRES_HOURS * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpires: expires },
    });

    // 在实际场景中应通过邮件发送 token，此处直接返回便于测试。
    res.json({ resetToken: token, expiresAt: expires });
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
