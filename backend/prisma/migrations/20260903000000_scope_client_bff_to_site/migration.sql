ALTER TABLE `ClientBffActivation`
  ADD COLUMN `siteId` INTEGER NULL AFTER `userId`,
  ADD INDEX `ClientBffActivation_siteId_createdAt_idx`(`siteId`, `createdAt`);

ALTER TABLE `ClientBffInstance`
  ADD COLUMN `siteId` INTEGER NULL AFTER `userId`,
  ADD INDEX `ClientBffInstance_siteId_createdAt_idx`(`siteId`, `createdAt`);

ALTER TABLE `ClientBffActivation`
  ADD CONSTRAINT `ClientBffActivation_siteId_fkey`
  FOREIGN KEY (`siteId`) REFERENCES `UserSite`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ClientBffInstance`
  ADD CONSTRAINT `ClientBffInstance_siteId_fkey`
  FOREIGN KEY (`siteId`) REFERENCES `UserSite`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
