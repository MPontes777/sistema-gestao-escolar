-- AlterTable
ALTER TABLE "turmas" ADD COLUMN     "anoSerieId" TEXT;

-- CreateTable
CREATE TABLE "ano_serie" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "etapa" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "ano_serie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ano_serie_nome_key" ON "ano_serie"("nome");

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_anoSerieId_fkey" FOREIGN KEY ("anoSerieId") REFERENCES "ano_serie"("id") ON DELETE SET NULL ON UPDATE CASCADE;
