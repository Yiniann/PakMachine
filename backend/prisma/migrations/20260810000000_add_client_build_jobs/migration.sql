ALTER TABLE `BuildJob`
  ADD COLUMN `buildKind` VARCHAR(191) NOT NULL DEFAULT 'web',
  ADD COLUMN `platform` VARCHAR(191) NULL,
  ADD COLUMN `arch` VARCHAR(191) NULL,
  ADD COLUMN `version` VARCHAR(191) NULL,
  ADD COLUMN `objectKey` VARCHAR(512) NULL,
  ADD COLUMN `artifactFilename` VARCHAR(512) NULL,
  ADD COLUMN `artifactSize` INTEGER NULL,
  ADD COLUMN `artifactSha256` VARCHAR(64) NULL,
  ADD COLUMN `githubRunId` VARCHAR(191) NULL,
  ADD COLUMN `expiresAt` DATETIME(3) NULL;

CREATE INDEX `BuildJob_userId_buildKind_createdAt_idx`
  ON `BuildJob`(`userId`, `buildKind`, `createdAt`);
