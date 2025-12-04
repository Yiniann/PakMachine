import { Router } from "express";
import { forgotPassword, listUsers, login, register, resetPassword } from "../controllers/userController";

const router = Router();

router.get("/", listUsers);
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
