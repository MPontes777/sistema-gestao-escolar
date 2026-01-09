/*
  Warnings:

  - A unique constraint covering the columns `[anoSerie,letra,periodo,anoLetivo]` on the table `turmas` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "turmas_anoSerie_letra_periodo_key";

-- CreateIndex
CREATE UNIQUE INDEX "turmas_anoSerie_letra_periodo_anoLetivo_key" ON "turmas"("anoSerie", "letra", "periodo", "anoLetivo");
