import { Router } from "express";
import { adminCreateUser, adminDeleteUser, adminUpdatePassword, adminUpdateRole, listUsers } from "../controllers/userController";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = Router();

router.use(authenticate, requireAdmin);
router.get("/getUsers", listUsers);
router.post("/addUser", adminCreateUser);
router.delete("/deleteUser/:id", adminDeleteUser);
router.patch("/changePwd", adminUpdatePassword);
router.patch("/changeRole", adminUpdateRole);

export default router;
