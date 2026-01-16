/*
  Warnings:

  - The values [ADMIN,PROFESSOR] on the enum `Perfil` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Perfil_new" AS ENUM ('admin', 'professor');
ALTER TABLE "usuarios" ALTER COLUMN "perfil" TYPE "Perfil_new" USING ("perfil"::text::"Perfil_new");
ALTER TYPE "Perfil" RENAME TO "Perfil_old";
ALTER TYPE "Perfil_new" RENAME TO "Perfil";
DROP TYPE "Perfil_old";
COMMIT;
