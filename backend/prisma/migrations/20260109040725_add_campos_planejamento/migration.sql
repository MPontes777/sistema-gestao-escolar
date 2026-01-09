-- AlterTable
ALTER TABLE "planejamentos" ADD COLUMN     "metodologia" TEXT,
ADD COLUMN     "objetivo" TEXT,
ALTER COLUMN "conteudo" DROP NOT NULL;
