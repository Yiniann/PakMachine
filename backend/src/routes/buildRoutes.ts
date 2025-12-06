import { Router } from "express";
import { buildTemplatePackage, downloadBuildArtifact, getBuildProfile, listUploadedTemplates, saveBuildProfile } from "../controllers/uploadController";
import { authenticate } from "../middleware/auth";
import { UploadError } from "../services/uploadService";

const router = Router();

router.use(authenticate);
router.get("/templates", listUploadedTemplates);
router.post("/", buildTemplatePackage);
router.get("/profile", getBuildProfile);
router.put("/profile", saveBuildProfile);
router.get("/download/:id", downloadBuildArtifact);

// Error handler to surface build/upload errors
router.use((err: unknown, _req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
  if (err instanceof UploadError) {
    return res.status(err.status).json({ error: err.message });
  }
  next(err);
});

export default router;
