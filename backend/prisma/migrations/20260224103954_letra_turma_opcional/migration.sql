/*
  Warnings:

  - A unique constraint covering the columns `[anoSerieId,letra,anoLetivo]` on the table `turmas` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "turmas_anoSerieId_letra_periodo_anoLetivo_key";

-- AlterTable
ALTER TABLE "turmas" ALTER COLUMN "letra" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "turmas_anoSerieId_letra_anoLetivo_key" ON "turmas"("anoSerieId", "letra", "anoLetivo");
