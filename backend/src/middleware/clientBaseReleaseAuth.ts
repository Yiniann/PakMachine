import crypto from "crypto";
import { NextFunction, Request, Response } from "express";

export const authenticateClientBaseRelease = (req: Request, res: Response, next: NextFunction) => {
  const expected = String(process.env.CLIENT_BASE_RELEASE_TOKEN || "");
  if (Buffer.byteLength(expected, "utf8") < 32 || /[\r\n]/.test(expected)) {
    return res.status(503).json({ error: "客户端基础包发布服务尚未配置" });
  }
  const header = req.headers.authorization;
  const supplied = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  if (suppliedBuffer.length !== expectedBuffer.length
    || !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) {
    return res.status(401).json({ error: "基础包发布凭证无效" });
  }
  next();
};
