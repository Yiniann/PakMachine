ALTER TABLE `User`
  ADD COLUMN `frontendOriginsLimit` INT NOT NULL DEFAULT 4 AFTER `siteNameLimit`;
