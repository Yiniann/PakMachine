import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import routes from "./routes";
import webhookRoutes from "./routes/webhookRoutes";
import { uploadBaseDir } from "./middleware/upload";
import { startBuildWorker } from "./services/buildWorker";
import { checkAndFixInitialization, isInitialized } from "./controllers/systemSettingsController";

const app = express();
const uploadsTemplates = uploadBaseDir;

// Allow local dev ports plus any comma-separated origins from ALLOWED_ORIGIN env (e.g. "https://pac.xiamii.com,https://foo.com")
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  ...(process.env.ALLOWED_ORIGIN
    ? process.env.ALLOWED_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean)
    : []),
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    exposedHeaders: ["x-build-quota-used", "x-build-quota-left"],
  }),
);
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  }),
);
app.use("/uploads/templates", express.static(uploadsTemplates));
app.use("/webhooks", webhookRoutes);
// Support both plain backend routes ("/init") and prefixed ones ("/api/init")
app.use("/api", routes);
app.use(routes);

// 仅在系统已初始化且有可用数据库时再启动后台构建轮询
if (isInitialized()) {
  checkAndFixInitialization()
    .then((inited) => {
      if (inited) {
        startBuildWorker();
      }
    })
    .catch((err) => {
      console.warn("[init] failed to verify initialization status at startup", err);
    });
}

// Centralized error handler.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
