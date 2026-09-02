ALTER TABLE `ClientBuildManifest`
  ADD COLUMN `progress` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `message` VARCHAR(500) NULL,
  ADD COLUMN `artifactFilename` VARCHAR(255) NULL,
  ADD COLUMN `artifactSize` BIGINT NULL,
  ADD COLUMN `artifactSha256` CHAR(64) NULL,
  ADD COLUMN `startedAt` DATETIME(3) NULL,
  ADD COLUMN `completedAt` DATETIME(3) NULL,
  ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

CREATE INDEX `ClientBuildManifest_status_updatedAt_idx`
  ON `ClientBuildManifest`(`status`, `updatedAt`);
