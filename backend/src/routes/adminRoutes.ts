import { Router } from "express";
import { listUsers } from "../controllers/userController";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = Router();

router.use(authenticate, requireAdmin);
router.get("/getUsers", listUsers);

export default router;
