/*
  Warnings:

  - You are about to drop the column `artifactPath` on the `BuildJob` table. All the data in the column will be lost.
  - You are about to drop the column `log` on the `BuildJob` table. All the data in the column will be lost.
  - You are about to drop the column `templateId` on the `BuildJob` table. All the data in the column will be lost.
  - Added the required column `filename` to the `BuildJob` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `BuildJob` DROP FOREIGN KEY `BuildJob_templateId_fkey`;

-- AlterTable
ALTER TABLE `BuildJob` DROP COLUMN `artifactPath`,
    DROP COLUMN `log`,
    DROP COLUMN `templateId`,
    ADD COLUMN `artifactId` INTEGER NULL,
    ADD COLUMN `filename` VARCHAR(191) NOT NULL,
    ADD COLUMN `message` VARCHAR(191) NULL;
