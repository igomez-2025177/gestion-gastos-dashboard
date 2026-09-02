/*
  Warnings:

  - The values [OCIO,BONO14] on the enum `MovementCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "BusinessRole" AS ENUM ('OWNER', 'GERENTE', 'CONFIANZA');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA');

-- AlterEnum
BEGIN;
CREATE TYPE "MovementCategory_new" AS ENUM ('ALIMENTACION', 'TRANSPORTE', 'SERVICIOS', 'SALUD', 'SUELDO', 'BONO', 'VENTA', 'INVERSION', 'SERVICIO_PRESTADO', 'PROVEEDORES', 'NOMINA', 'ALQUILER', 'MARKETING', 'IMPUESTOS', 'MANTENIMIENTO', 'OTROS');
ALTER TABLE "movements" ALTER COLUMN "category" TYPE "MovementCategory_new" USING ("category"::text::"MovementCategory_new");
ALTER TYPE "MovementCategory" RENAME TO "MovementCategory_old";
ALTER TYPE "MovementCategory_new" RENAME TO "MovementCategory";
DROP TYPE "public"."MovementCategory_old";
COMMIT;

-- AlterTable
ALTER TABLE "movements" ADD COLUMN     "businessId" TEXT;

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_memberships" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "role" "BusinessRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'PENDIENTE',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_memberships_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "movements" ADD CONSTRAINT "movements_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_memberships" ADD CONSTRAINT "business_memberships_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_memberships" ADD CONSTRAINT "business_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
