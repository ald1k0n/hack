/*
  Warnings:

  - Changed the type of `file` on the `File` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "file",
ADD COLUMN     "file" BYTEA NOT NULL;
