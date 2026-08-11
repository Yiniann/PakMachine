ALTER TABLE `UserSite`
  ADD COLUMN `clientBuildEnabled` BOOLEAN NOT NULL DEFAULT false AFTER `frontendOriginsLimit`;

-- Preserve the client-build access administrators had before permissions became brand-scoped.
UPDATE `UserSite` site
JOIN `User` user ON user.`id` = site.`userId`
SET site.`clientBuildEnabled` = true
WHERE user.`role` = 'admin';
