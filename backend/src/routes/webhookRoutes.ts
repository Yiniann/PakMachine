import { Router } from "express";
import { handleGithubBuildWebhook } from "../controllers/githubWebhookController";

const router = Router();

// GitHub Actions 回调（自定义 webhook）
router.post("/github", handleGithubBuildWebhook);

export default router;
