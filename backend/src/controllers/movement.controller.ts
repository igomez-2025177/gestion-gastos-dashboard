import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middlewares/auth.middleware";
import { MovementType, MovementCategory } from "../generated/prisma/client";

const VALID_TYPES = Object.values(MovementType);

const INCOME_CATEGORIES: MovementCategory[] = ["SUELDO", "BONO", "BONO14", "VENTA", "INVERSION", "OTROS"];
const EXPENSE_CATEGORIES: MovementCategory[] = ["ALIMENTACION", "TRANSPORTE", "SERVICIOS", "SALUD", "OTROS"];

function isCategoryValidForType(type: MovementType, category: MovementCategory): boolean {
  if (type === "INGRESO") return INCOME_CATEGORIES.includes(category);
  return EXPENSE_CATEGORIES.includes(category);
}

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

    if (!isCategoryValidForType(type, category)) {
      const validList = type === "INGRESO" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      return res.status(400).json({
        error: `Categoría inválida para ${type}, debe ser una de: ${validList.join(", ")}`,
      });
    }

    const numericAmount = Number(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "El monto debe ser un número mayor a 0" });
    }

    // ya no se calcula IGSS/ISR: el profesor indico que no aplica para este proyecto.
    // el monto se guarda tal cual, sin ningun descuento
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

export async function updateMovement(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { type, category, amount, description, date } = req.body;

    const existing = await prisma.movement.findUnique({ where: { id } });

    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Movimiento no encontrado" });
    }

    if (!type || !category || amount === undefined) {
      return res.status(400).json({ error: "Faltan campos: type, category, amount" });
    }

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Tipo inválido, debe ser uno de: ${VALID_TYPES.join(", ")}`,
      });
    }

    if (!isCategoryValidForType(type, category)) {
      const validList = type === "INGRESO" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      return res.status(400).json({
        error: `Categoría inválida para ${type}, debe ser una de: ${validList.join(", ")}`,
      });
    }

    const numericAmount = Number(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "El monto debe ser un número mayor a 0" });
    }

    const movement = await prisma.movement.update({
      where: { id },
      data: {
        type,
        category,
        amount: numericAmount,
        description: description || null,
        date: date ? new Date(date) : existing.date,
      },
    });

    return res.status(200).json({
      message: "Movimiento actualizado correctamente",
      movement,
    });
  } catch (error) {
    console.error("Error en updateMovement:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function deleteMovement(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const existing = await prisma.movement.findUnique({ where: { id } });

    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: "Movimiento no encontrado" });
    }

    await prisma.movement.delete({ where: { id } });

    return res.status(200).json({ message: "Movimiento eliminado correctamente" });
  } catch (error) {
    console.error("Error en deleteMovement:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}