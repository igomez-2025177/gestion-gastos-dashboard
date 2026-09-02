import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middlewares/auth.middleware";
import { MovementType, MovementCategory } from "../generated/prisma/client";

const VALID_TYPES = Object.values(MovementType);
const VALID_CATEGORIES = Object.values(MovementCategory);

export async function createMovement(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { type, category, amount, description, date } = req.body;

    if (!type || !category || amount === undefined) {
      return res.status(400).json({ error: "Faltan campos: type, category, amount" });
    }

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Tipo inválido, debe ser uno de: ${VALID_TYPES.join(", ")}`,
      });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `Categoría inválida, debe ser una de: ${VALID_CATEGORIES.join(", ")}`,
      });
    }

    const numericAmount = Number(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "El monto debe ser un número mayor a 0" });
    }

    const movement = await prisma.movement.create({
      data: {
        type,
        category,
        amount: numericAmount,
        description: description || null,
        date: date ? new Date(date) : new Date(),
        userId: userId!,
      },
    });

    return res.status(201).json({
      message: "Movimiento registrado correctamente",
      movement,
    });
  } catch (error) {
    console.error("Error en createMovement:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function getMovements(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;

    const movements = await prisma.movement.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });

    return res.status(200).json({ movements });
  } catch (error) {
    console.error("Error en getMovements:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}