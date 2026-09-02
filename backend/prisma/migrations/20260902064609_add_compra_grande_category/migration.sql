-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('INGRESO', 'GASTO');

-- CreateEnum
CREATE TYPE "MovementCategory" AS ENUM ('ALIMENTACION', 'TRANSPORTE', 'SERVICIOS', 'OCIO', 'SALUD', 'SUELDO', 'BONO', 'BONO14', 'VENTA', 'INVERSION', 'OTROS');

-- CreateTable
CREATE TABLE "movements" (
    "id" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "category" "MovementCategory" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "igssAmount" DOUBLE PRECISION,
    "isrAmount" DOUBLE PRECISION,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "movements_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "movements" ADD CONSTRAINT "movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
