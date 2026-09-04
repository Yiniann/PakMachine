-- Bind legacy BFF instances only when their owner has exactly one eligible brand.
UPDATE `ClientBffInstance` instance
JOIN (
  SELECT `userId`, MIN(`id`) AS `siteId`
  FROM `UserSite`
  WHERE `clientBuildEnabled` = true
  GROUP BY `userId`
  HAVING COUNT(*) = 1
) single_site ON single_site.`userId` = instance.`userId`
SET instance.`siteId` = single_site.`siteId`
WHERE instance.`siteId` IS NULL;
