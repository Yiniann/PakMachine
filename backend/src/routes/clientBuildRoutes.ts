import { Router } from "express";
import { createClientBuild, createClientDownload, listClientBuilds } from "../controllers/clientBuildController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);
router.post("/", createClientBuild);
router.get("/jobs", listClientBuilds);
router.post("/download/:id", createClientDownload);

export default router;
