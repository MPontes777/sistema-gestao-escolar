/*
  Warnings:

  - Added the required column `nomeResponsavel` to the `alunos` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `alunos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `telefone` on table `alunos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `endereco` on table `alunos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `turmaId` on table `alunos` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "alunos" ADD COLUMN     "nomeResponsavel" TEXT NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "telefone" SET NOT NULL,
ALTER COLUMN "endereco" SET NOT NULL,
ALTER COLUMN "turmaId" SET NOT NULL;
