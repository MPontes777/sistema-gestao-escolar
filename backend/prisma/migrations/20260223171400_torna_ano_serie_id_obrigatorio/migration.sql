/*
  Warnings:

  - You are about to drop the column `anoSerie` on the `turmas` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[anoSerieId,letra,periodo,anoLetivo]` on the table `turmas` will be added. If there are existing duplicate values, this will fail.
  - Made the column `anoSerieId` on table `turmas` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "turmas" DROP CONSTRAINT "turmas_anoSerieId_fkey";

-- DropIndex
DROP INDEX "turmas_anoSerie_letra_periodo_anoLetivo_key";

-- AlterTable
ALTER TABLE "turmas" DROP COLUMN "anoSerie",
ALTER COLUMN "anoSerieId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "turmas_anoSerieId_letra_periodo_anoLetivo_key" ON "turmas"("anoSerieId", "letra", "periodo", "anoLetivo");

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_anoSerieId_fkey" FOREIGN KEY ("anoSerieId") REFERENCES "ano_serie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
