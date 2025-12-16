import nodemailer from "nodemailer";
import { loadSettings } from "../controllers/systemSettingsController";

type MailConfig = {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  from?: string;
  resetBaseUrl?: string;
};

const resolveMailConfig = (): MailConfig => {
  const settings = loadSettings();
  const port = settings.mailerPort ?? (process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined);
  return {
    host: settings.mailerHost || process.env.SMTP_HOST,
    port: Number.isFinite(port) ? port : undefined,
    secure: settings.mailerSecure ?? (process.env.SMTP_SECURE === "true"),
    user: settings.mailerUser || process.env.SMTP_USER,
    pass: settings.mailerPass || process.env.SMTP_PASS,
    from: settings.mailerFrom || process.env.SMTP_FROM,
    resetBaseUrl: settings.passwordResetBaseUrl || process.env.PASSWORD_RESET_BASE_URL,
  };
};

export const isMailConfigured = () => {
  const cfg = resolveMailConfig();
  return Boolean(cfg.host && cfg.port && cfg.from);
};

export const buildResetUrl = (token: string) => {
  const cfg = resolveMailConfig();
  const base = cfg.resetBaseUrl || "http://localhost:5173/auth/reset";
  try {
    const url = new URL(base);
    url.searchParams.set("token", token);
    return url.toString();
  } catch {
    return `${base}?token=${encodeURIComponent(token)}`;
  }
};

type ResetMailPayload = {
  to: string;
  resetUrl: string;
  token: string;
  expiresAt: Date;
};

export const sendPasswordResetEmail = async (
  payload: ResetMailPayload,
): Promise<{ sent: boolean; reason?: string }> => {
  const cfg = resolveMailConfig();
  if (!cfg.host || !cfg.port || !cfg.from) {
    return { sent: false, reason: "not_configured" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure ?? cfg.port === 465,
      auth: cfg.user ? { user: cfg.user, pass: cfg.pass || "" } : undefined,
    });

    const subject = "密码重置";
    const text = [
      "收到密码重置请求，如非本人操作可忽略本邮件。",
      `重置链接：${payload.resetUrl}`,
      `重置令牌：${payload.token}`,
      `有效期：${payload.expiresAt.toLocaleString()}`,
    ].join("\n");

    const html = `
      <p>收到密码重置请求，如非本人操作可忽略本邮件。</p>
      <p>重置链接：<a href="${payload.resetUrl}">${payload.resetUrl}</a></p>
      <p>重置令牌：<code style="padding:2px 4px;background:#f4f4f5;border-radius:4px;">${payload.token}</code></p>
      <p>有效期：${payload.expiresAt.toLocaleString()}</p>
    `;

    await transporter.sendMail({
      from: cfg.from,
      to: payload.to,
      subject,
      text,
      html,
    });

    return { sent: true };
  } catch (err) {
    console.error("[mail] Failed to send reset email", err);
    return { sent: false, reason: "send_failed" };
  }
};
