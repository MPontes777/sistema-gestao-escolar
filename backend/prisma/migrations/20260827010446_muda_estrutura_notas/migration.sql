/*
  Warnings:

  - You are about to drop the column `criterio` on the `notas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "notas" DROP COLUMN "criterio",
ADD COLUMN     "mediaParcial" DOUBLE PRECISION,
ADD COLUMN     "motivoAprovacao" TEXT,
ADD COLUMN     "motivoDescricao" TEXT,
ADD COLUMN     "resultado" TEXT;
