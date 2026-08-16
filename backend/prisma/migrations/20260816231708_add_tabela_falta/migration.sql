-- CreateTable
CREATE TABLE "faltas" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "planejamentoId" TEXT NOT NULL,
    "quantidadeFaltas" INTEGER NOT NULL DEFAULT 0,
    "justificativa" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faltas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "faltas_alunoId_planejamentoId_key" ON "faltas"("alunoId", "planejamentoId");

-- AddForeignKey
ALTER TABLE "faltas" ADD CONSTRAINT "faltas_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faltas" ADD CONSTRAINT "faltas_planejamentoId_fkey" FOREIGN KEY ("planejamentoId") REFERENCES "planejamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
