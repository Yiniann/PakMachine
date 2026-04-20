import { Router } from "express";
import {
  getCurrentUser,
  forgotPassword,
  login,
  register,
  resetPassword,
  changePassword,
  sendRegisterCode,
} from "../controllers/userController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/me", authenticate, getCurrentUser);
router.post("/register", register);
router.post("/register/send-code", sendRegisterCode);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", authenticate, changePassword);

export default router;
