/*
  Warnings:

  - You are about to drop the column `category_id` on the `circuits` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "_CategoryToCircuit" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_CategoryToCircuit_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CategoryToCircuit_B_index" ON "_CategoryToCircuit"("B");

-- AddForeignKey
ALTER TABLE "_CategoryToCircuit" ADD CONSTRAINT "_CategoryToCircuit_A_fkey" FOREIGN KEY ("A") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToCircuit" ADD CONSTRAINT "_CategoryToCircuit_B_fkey" FOREIGN KEY ("B") REFERENCES "circuits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BackfillData
-- Reprise de l'ancienne catégorie unique de chaque circuit dans la relation
-- m-n, avant la suppression de la colonne category_id.
INSERT INTO "_CategoryToCircuit" ("A", "B")
SELECT "category_id", "id" FROM "circuits" WHERE "category_id" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "circuits" DROP CONSTRAINT "circuits_category_id_fkey";

-- DropIndex
DROP INDEX "circuits_category_id_idx";

-- AlterTable
ALTER TABLE "circuits" DROP COLUMN "category_id";
