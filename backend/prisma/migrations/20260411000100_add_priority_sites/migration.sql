CREATE TABLE `UserSite` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `UserSite_userId_createdAt_idx`(`userId`, `createdAt`),
  UNIQUE INDEX `UserSite_userId_name_key`(`userId`, `name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `BuildJob`
  ADD COLUMN `siteId` INTEGER NULL,
  ADD COLUMN `siteNameSnapshot` VARCHAR(191) NULL;

INSERT INTO `UserSite` (`userId`, `name`, `createdAt`, `updatedAt`)
SELECT `id`, `siteName`, NOW(3), NOW(3)
FROM `User`
WHERE `siteName` IS NOT NULL
  AND TRIM(`siteName`) <> '';

UPDATE `BuildJob` bj
JOIN `User` u ON u.`id` = bj.`userId`
SET bj.`siteNameSnapshot` = u.`siteName`
WHERE bj.`siteNameSnapshot` IS NULL
  AND u.`siteName` IS NOT NULL
  AND TRIM(u.`siteName`) <> '';

ALTER TABLE `BuildJob`
  ADD CONSTRAINT `BuildJob_siteId_fkey`
  FOREIGN KEY (`siteId`) REFERENCES `UserSite`(`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE `UserSite`
  ADD CONSTRAINT `UserSite_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE
  ON UPDATE CASCADE;
