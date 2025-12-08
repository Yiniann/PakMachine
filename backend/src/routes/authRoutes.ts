import { Router } from "express";
import { forgotPassword, login, register, resetPassword, changePassword } from "../controllers/userController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", authenticate, changePassword);

export default router;
