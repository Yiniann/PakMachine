import { Router } from "express";
import { checkInitialized, initializeSystem } from "../controllers/initController";

const router = Router();

router.get("/", checkInitialized);
router.post("/", initializeSystem);

export default router;
