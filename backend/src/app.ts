import express, { NextFunction, Request, Response } from "express";
import routes from "./routes";

const app = express();

app.use(express.json());
app.use(routes);

// Centralized error handler.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
