import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("No se encontró JWT_SECRET en el .env");
}

// Constante nueva con tipo ya fijado en "string" (no "string | undefined"),
// para que TypeScript la acepte dentro de las funciones de abajo
const secret: string = JWT_SECRET;

export interface JwtPayload {
  userId: string;
  role: "ADMIN" | "USER";
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, secret, { expiresIn: "1d" });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, secret);
  return decoded as unknown as JwtPayload;
}