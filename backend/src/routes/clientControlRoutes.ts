import { Router } from "express";
import {
  createClientBffActivation,
  enrollClientBff,
  issueClientBuildManifest,
  listClientBffBrands,
  listClientBrands,
  saveClientBrandIdentity,
} from "../controllers/clientControlController";
import { authenticate } from "../middleware/auth";
import { authenticateClientBff } from "../middleware/clientBffAuth";

const router = Router();

router.post("/activation", authenticate, createClientBffActivation);
router.get("/brands", authenticate, listClientBrands);
router.put("/brands/:siteId", authenticate, saveClientBrandIdentity);
router.post("/v1/enroll", enrollClientBff);
router.get("/v1/brands", authenticateClientBff, listClientBffBrands);
router.post("/v1/build-manifests", authenticateClientBff, issueClientBuildManifest);

export default router;
