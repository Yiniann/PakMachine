import { Router } from "express";
import authRoutes from "./authRoutes";
import adminRoutes from "./adminRoutes";
import buildRoutes from "./buildRoutes";
import { getPublicSystemSettings } from "../controllers/systemSettingsController";
import initRoutes from "./initRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/build", buildRoutes);
router.use("/init", initRoutes);
router.get("/comm/config", getPublicSystemSettings);

export default router;
