import { Router } from "express";
import { healthCheck } from "../controllers/healthController";

const router = Router();

router.get(["/health", "/healthy", "/helthy"], healthCheck);

export default router;
