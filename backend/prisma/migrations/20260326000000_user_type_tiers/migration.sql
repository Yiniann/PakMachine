UPDATE `User`
SET `userType` = 'basic'
WHERE `userType` = 'free';

UPDATE `User`
SET `userType` = 'pro'
WHERE `userType` = 'subscriber';

UPDATE `User`
SET `userType` = 'pending'
WHERE `userType` IS NULL OR `userType` NOT IN ('pending', 'basic', 'pro');

ALTER TABLE `User`
MODIFY `userType` VARCHAR(191) NOT NULL DEFAULT 'pending';
