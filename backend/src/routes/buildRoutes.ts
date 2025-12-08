import { Router } from "express";
import {
  buildTemplateJobStatus,
  buildTemplatePackage,
  downloadBuildArtifact,
  getBuildProfile,
  listUploadedTemplates,
  listUserArtifacts,
  listUserBuildJobs,
  saveBuildProfile,
} from "../controllers/buildController";
import { getBuildQuota } from "../controllers/quotaController";
import { getSiteName, setSiteName } from "../controllers/profileController";
import { authenticate } from "../middleware/auth";
import { UploadError } from "../services/uploadService";

const router = Router();

router.use(authenticate);
router.get("/templates", listUploadedTemplates);
router.post("/", buildTemplatePackage);
router.get("/job/:id", buildTemplateJobStatus);
router.get("/profile", getBuildProfile);
router.put("/profile", saveBuildProfile);
router.get("/site-name", getSiteName);
router.post("/site-name", setSiteName);
router.get("/download/:id", downloadBuildArtifact);
router.get("/artifacts", listUserArtifacts);
router.get("/jobs", listUserBuildJobs);
router.get("/quota", getBuildQuota);

// Error handler to surface build/upload errors
router.use((err: unknown, _req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
  if (err instanceof UploadError) {
    return res.status(err.status).json({ error: err.message });
  }
  next(err);
});

export default router;
