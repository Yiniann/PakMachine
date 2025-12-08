import { Router } from "express";
import { adminCreateUser, adminDeleteUser, adminResetSiteName, adminUpdatePassword, adminUpdateRole, listUsers } from "../controllers/userController";
import { removeTemplate, renameUploadedTemplate, uploadTemplate } from "../controllers/uploadController";
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
router.post("/upload-template", templateUploadHandler, uploadTemplate);
router.delete("/upload-template/:filename", removeTemplate);
router.patch("/upload-template/:filename", renameUploadedTemplate);

// Local error handler to surface service errors as 400s.
router.use((err: unknown, _req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
  if (err instanceof UploadError) {
    return res.status(err.status).json({ error: err.message });
  }
  next(err);
});

export default router;
