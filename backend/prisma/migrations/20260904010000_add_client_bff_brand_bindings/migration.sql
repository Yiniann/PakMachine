CREATE TABLE `ClientBffInstanceSite` (
  `instanceId` VARCHAR(36) NOT NULL,
  `siteId` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`instanceId`, `siteId`),
  INDEX `ClientBffInstanceSite_siteId_createdAt_idx`(`siteId`, `createdAt`),
  CONSTRAINT `ClientBffInstanceSite_instanceId_fkey`
    FOREIGN KEY (`instanceId`) REFERENCES `ClientBffInstance`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ClientBffInstanceSite_siteId_fkey`
    FOREIGN KEY (`siteId`) REFERENCES `UserSite`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Existing BFF instances previously had account-wide brand access. Preserve that
-- access when introducing explicit per-brand bindings.
INSERT IGNORE INTO `ClientBffInstanceSite` (`instanceId`, `siteId`, `createdAt`)
SELECT instance.`id`, site.`id`, CURRENT_TIMESTAMP(3)
FROM `ClientBffInstance` instance
JOIN `UserSite` site
  ON site.`userId` = instance.`userId`
  AND site.`clientBuildEnabled` = true;

-- The legacy first-brand pointer is informational only. Removing that brand
-- must not remove a BFF that is still authorized for other brands.
ALTER TABLE `ClientBffInstance`
  DROP FOREIGN KEY `ClientBffInstance_siteId_fkey`;

ALTER TABLE `ClientBffInstance`
  ADD CONSTRAINT `ClientBffInstance_siteId_fkey`
  FOREIGN KEY (`siteId`) REFERENCES `UserSite`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
