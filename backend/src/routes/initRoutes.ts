import { Router } from "express";
import { checkInitialized, initializeSystem } from "../controllers/initController";
import { saveDatabaseUrl } from "../controllers/dbConfigController";

const router = Router();

router.get("/", checkInitialized);
router.post("/", initializeSystem);
router.post("/database", saveDatabaseUrl);

export default router;
