ALTER TABLE `UserSite`
  ADD COLUMN `frontendOriginsLimit` INTEGER NOT NULL DEFAULT 4 AFTER `name`;

CREATE TABLE `FrontendOrigin` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NOT NULL,
  `origin` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `FrontendOrigin_userId_origin_key`(`userId`, `origin`),
  INDEX `FrontendOrigin_userId_createdAt_idx`(`userId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SiteFrontendOrigin` (
  `siteId` INTEGER NOT NULL,
  `originId` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `SiteFrontendOrigin_originId_idx`(`originId`),
  PRIMARY KEY (`siteId`, `originId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Ensure every legacy brand name has a real UserSite before copying domains.
INSERT IGNORE INTO `UserSite` (`userId`, `name`, `frontendOriginsLimit`, `createdAt`, `updatedAt`)
SELECT `id`, TRIM(`siteName`), 4, NOW(3), NOW(3)
FROM `User`
WHERE `siteName` IS NOT NULL AND TRIM(`siteName`) <> '';

-- Keep enough slots for all legacy domains on every existing brand.
UPDATE `UserSite` site
JOIN `User` user ON user.`id` = site.`userId`
SET site.`frontendOriginsLimit` = GREATEST(
  4,
  COALESCE(user.`frontendOriginsLimit`, 4),
  CASE
    WHEN JSON_VALID(user.`frontendOriginsJson`) THEN
      CASE
        WHEN JSON_TYPE(user.`frontendOriginsJson`) = 'ARRAY' THEN JSON_LENGTH(user.`frontendOriginsJson`)
        ELSE 0
      END
    ELSE 0
  END
);

-- Normalize each user's old JSON array into owned origin records.
INSERT IGNORE INTO `FrontendOrigin` (`userId`, `origin`, `createdAt`, `updatedAt`)
SELECT DISTINCT user.`id`, TRIM(legacy.`origin`), NOW(3), NOW(3)
FROM `User` user
CROSS JOIN JSON_TABLE(
  CASE
    WHEN JSON_VALID(user.`frontendOriginsJson`) THEN
      CASE
        WHEN JSON_TYPE(user.`frontendOriginsJson`) = 'ARRAY' THEN user.`frontendOriginsJson`
        ELSE JSON_ARRAY()
      END
    ELSE JSON_ARRAY()
  END,
  '$[*]' COLUMNS (`origin` VARCHAR(191) PATH '$')
) AS legacy
WHERE legacy.`origin` IS NOT NULL AND TRIM(legacy.`origin`) <> '';

-- Existing users become independent immediately, starting with the same old domains on every brand.
INSERT IGNORE INTO `SiteFrontendOrigin` (`siteId`, `originId`, `createdAt`)
SELECT site.`id`, origin.`id`, NOW(3)
FROM `UserSite` site
JOIN `FrontendOrigin` origin ON origin.`userId` = site.`userId`;

ALTER TABLE `FrontendOrigin`
  ADD CONSTRAINT `FrontendOrigin_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `SiteFrontendOrigin`
  ADD CONSTRAINT `SiteFrontendOrigin_siteId_fkey`
  FOREIGN KEY (`siteId`) REFERENCES `UserSite`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `SiteFrontendOrigin_originId_fkey`
  FOREIGN KEY (`originId`) REFERENCES `FrontendOrigin`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
