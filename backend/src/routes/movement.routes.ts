import { Router } from "express";
import { createMovement, getMovements, updateMovement, deleteMovement } from "../controllers/movement.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", authMiddleware, createMovement);
router.get("/", authMiddleware, getMovements);
router.put("/:id", authMiddleware, updateMovement);
router.delete("/:id", authMiddleware, deleteMovement);

export default router;