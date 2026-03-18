import { Router } from "express";
import { addMyTicketMessage, createMyTicket, getMyTicket, listMyTickets } from "../controllers/ticketController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);
router.get("/", listMyTickets);
router.post("/", createMyTicket);
router.get("/:id", getMyTicket);
router.post("/:id/messages", addMyTicketMessage);

export default router;
