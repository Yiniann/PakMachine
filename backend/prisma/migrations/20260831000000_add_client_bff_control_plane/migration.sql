ALTER TABLE `ClientAppConfig`
  ADD COLUMN `publisher` VARCHAR(191) NULL,
  ADD COLUMN `iconUrl` TEXT NULL;

CREATE TABLE `ClientBffActivation` (
  `id` VARCHAR(36) NOT NULL,
  `userId` INTEGER NOT NULL,
  `tokenHash` CHAR(64) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `consumedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `ClientBffActivation_tokenHash_key`(`tokenHash`),
  INDEX `ClientBffActivation_userId_createdAt_idx`(`userId`, `createdAt`),
  INDEX `ClientBffActivation_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ClientBffInstance` (
  `id` VARCHAR(36) NOT NULL,
  `userId` INTEGER NOT NULL,
  `name` VARCHAR(191) NULL,
  `publicKey` TEXT NOT NULL,
  `bootstrapPublicProfileBase64` LONGTEXT NOT NULL,
  `accessTokenHash` CHAR(64) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'active',
  `lastSeenAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `ClientBffInstance_accessTokenHash_key`(`accessTokenHash`),
  INDEX `ClientBffInstance_userId_createdAt_idx`(`userId`, `createdAt`),
  INDEX `ClientBffInstance_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ClientBuildManifest` (
  `id` VARCHAR(36) NOT NULL,
  `userId` INTEGER NOT NULL,
  `siteId` INTEGER NOT NULL,
  `instanceId` VARCHAR(36) NOT NULL,
  `platform` VARCHAR(191) NOT NULL,
  `manifestHash` CHAR(64) NOT NULL,
  `envelopeJson` LONGTEXT NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'issued',
  `expiresAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `ClientBuildManifest_userId_createdAt_idx`(`userId`, `createdAt`),
  INDEX `ClientBuildManifest_siteId_createdAt_idx`(`siteId`, `createdAt`),
  INDEX `ClientBuildManifest_instanceId_createdAt_idx`(`instanceId`, `createdAt`),
  INDEX `ClientBuildManifest_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ClientBffActivation`
  ADD CONSTRAINT `ClientBffActivation_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ClientBffInstance`
  ADD CONSTRAINT `ClientBffInstance_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ClientBuildManifest`
  ADD CONSTRAINT `ClientBuildManifest_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ClientBuildManifest`
  ADD CONSTRAINT `ClientBuildManifest_instanceId_fkey`
  FOREIGN KEY (`instanceId`) REFERENCES `ClientBffInstance`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
