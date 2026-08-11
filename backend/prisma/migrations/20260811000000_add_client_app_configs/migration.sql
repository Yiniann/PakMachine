CREATE TABLE `ClientAppConfig` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NOT NULL,
  `siteId` INTEGER NULL,
  `brandKey` VARCHAR(191) NOT NULL,
  `brandNameSnapshot` VARCHAR(191) NOT NULL,
  `appId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `ClientAppConfig_appId_key`(`appId`),
  UNIQUE INDEX `ClientAppConfig_userId_brandKey_key`(`userId`, `brandKey`),
  INDEX `ClientAppConfig_siteId_idx`(`siteId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ClientAppConfig`
  ADD CONSTRAINT `ClientAppConfig_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ClientAppConfig`
  ADD CONSTRAINT `ClientAppConfig_siteId_fkey`
  FOREIGN KEY (`siteId`) REFERENCES `UserSite`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
