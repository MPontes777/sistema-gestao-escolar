/*
  Warnings:

  - You are about to drop the `professor_disciplinas` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "professor_disciplinas" DROP CONSTRAINT "professor_disciplinas_disciplinaId_fkey";

-- DropForeignKey
ALTER TABLE "professor_disciplinas" DROP CONSTRAINT "professor_disciplinas_professorId_fkey";

-- DropTable
DROP TABLE "professor_disciplinas";

-- CreateTable
CREATE TABLE "professor_turmas" (
    "id" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "disciplinaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professor_turmas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "professor_turmas_professorId_turmaId_disciplinaId_key" ON "professor_turmas"("professorId", "turmaId", "disciplinaId");

-- AddForeignKey
ALTER TABLE "professor_turmas" ADD CONSTRAINT "professor_turmas_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professor_turmas" ADD CONSTRAINT "professor_turmas_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professor_turmas" ADD CONSTRAINT "professor_turmas_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "disciplinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
