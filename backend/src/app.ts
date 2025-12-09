import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import routes from "./routes";
import webhookRoutes from "./routes/webhookRoutes";
import path from "path";
import { uploadBaseDir } from "./middleware/upload";
import { startBuildWorker } from "./services/buildWorker";

const app = express();
const uploadsTemplates = uploadBaseDir;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
    ],
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
app.use(routes);
startBuildWorker();

// Centralized error handler.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
