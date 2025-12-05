import { Router } from "express";
import { listUsers } from "../controllers/userController";

const router = Router();

router.get("/getUsers", listUsers);

export default router;
