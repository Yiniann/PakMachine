import multer from "multer";
import path from "path";
import fs from "fs";

// Default to repo 根目录的 uploads/templates；可用 UPLOAD_BASE_DIR 覆盖。
export const uploadBaseDir =
  process.env.UPLOAD_BASE_DIR ||
  path.resolve(__dirname, "../../../uploads/templates");
fs.mkdirSync(uploadBaseDir, { recursive: true });

export const MAX_TEMPLATE_SIZE = undefined as unknown as number; // 不限制大小
const allowedSuffixes = [".zip", ".tar.gz", ".tgz"];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadBaseDir),
  filename: (_req, file, cb) => {
    const lower = file.originalname.toLowerCase();
    const matchedExt = allowedSuffixes.find((suf) => lower.endsWith(suf));
    const ext = matchedExt ?? (path.extname(lower) || ".zip");
    const baseRaw = matchedExt
      ? file.originalname.slice(0, file.originalname.length - matchedExt.length)
      : file.originalname.slice(0, file.originalname.length - (path.extname(file.originalname).length || 0));
    const safeBase = baseRaw.replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/^-+|-+$/g, "") || "file";
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const formatted = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const name = `${safeBase}-${formatted}${ext}`;
    cb(null, name);
  },
});

export const templateUpload = multer({
  storage,
  limits: { files: 1 },
  fileFilter: (_req, file, cb) => {
    const lower = file.originalname.toLowerCase();
    const ok = allowedSuffixes.some((suf) => lower.endsWith(suf));
    if (!ok) {
      return cb(new Error("INVALID_FILE_TYPE"));
    }
    cb(null, true);
  },
});

export const templateUploadHandler: import("express").RequestHandler = (req, res, next) =>
  templateUpload.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "文件过大，限制 50MB" });
        }
        return res.status(400).json({ error: err.message });
      }
      if (err instanceof Error && err.message === "INVALID_FILE_TYPE") {
        return res.status(400).json({ error: "仅允许上传 zip/tar.gz/tgz 压缩包" });
      }
      return next(err);
    }
    next();
  });
