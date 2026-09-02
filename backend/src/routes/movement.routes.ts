import { Router } from "express";
import { createMovement, getMovements } from "../controllers/movement.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", authMiddleware, createMovement);
router.get("/", authMiddleware, getMovements);

export default router;