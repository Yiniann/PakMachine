import { Router } from "express";
import {
  adminCreateUser,
  adminDeleteUser,
  adminResetBuildQuota,
  adminResetSiteName,
  adminUpdatePassword,
  adminUpdateRole,
  listUsers,
} from "../controllers/userController";
import { getSystemSettings, updateSystemSettings } from "../controllers/systemSettingsController";
import {
  createGithubTemplateEntry,
  listAllBuildJobs,
  listGithubTemplateEntries,
  removeGithubTemplateEntry,
  removeTemplate,
  renameUploadedTemplate,
  uploadTemplate,
} from "../controllers/buildController";
import { authenticate, requireAdmin } from "../middleware/auth";
import { templateUploadHandler } from "../middleware/upload";
import { UploadError } from "../services/uploadService";

const router = Router();

router.use(authenticate, requireAdmin);
router.get("/getUsers", listUsers);
router.post("/addUser", adminCreateUser);
router.delete("/deleteUser/:id", adminDeleteUser);
router.patch("/changePwd", adminUpdatePassword);
router.patch("/changeRole", adminUpdateRole);
router.patch("/resetSiteName", adminResetSiteName);
router.patch("/resetBuildQuota", adminResetBuildQuota);
router.get("/build-jobs", listAllBuildJobs);
router.get("/settings", getSystemSettings);
router.put("/settings", updateSystemSettings);
router.post("/upload-template", templateUploadHandler, uploadTemplate);
router.delete("/upload-template/:filename", removeTemplate);
router.patch("/upload-template/:filename", renameUploadedTemplate);
router.get("/github-templates", listGithubTemplateEntries);
router.post("/github-templates", createGithubTemplateEntry);
router.delete("/github-templates/:name", removeGithubTemplateEntry);

// Local error handler to surface service errors as 400s.
router.use((err: unknown, _req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
  if (err instanceof UploadError) {
    return res.status(err.status).json({ error: err.message });
  }
  next(err);
});

export default router;
