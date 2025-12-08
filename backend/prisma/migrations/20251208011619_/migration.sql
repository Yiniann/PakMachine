/*
  Warnings:

  - You are about to drop the `UserTemplateConfig` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `UserTemplateConfig` DROP FOREIGN KEY `UserTemplateConfig_templateId_fkey`;

-- DropForeignKey
ALTER TABLE `UserTemplateConfig` DROP FOREIGN KEY `UserTemplateConfig_userId_fkey`;

-- DropTable
DROP TABLE `UserTemplateConfig`;
