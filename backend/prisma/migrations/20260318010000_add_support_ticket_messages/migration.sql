-- CreateTable
CREATE TABLE `SupportTicketMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticketId` INTEGER NOT NULL,
    `authorId` INTEGER NULL,
    `senderRole` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SupportTicketMessage_ticketId_createdAt_idx`(`ticketId`, `createdAt`),
    INDEX `SupportTicketMessage_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill original ticket content as the first user message.
INSERT INTO `SupportTicketMessage` (`ticketId`, `authorId`, `senderRole`, `content`, `createdAt`)
SELECT `id`, `userId`, 'user', `content`, `createdAt`
FROM `SupportTicket`
WHERE `content` IS NOT NULL AND TRIM(`content`) <> '';

-- Backfill the legacy single admin reply as an admin message.
INSERT INTO `SupportTicketMessage` (`ticketId`, `authorId`, `senderRole`, `content`, `createdAt`)
SELECT `id`, NULL, 'admin', `adminReply`, COALESCE(`closedAt`, `updatedAt`, `createdAt`)
FROM `SupportTicket`
WHERE `adminReply` IS NOT NULL AND TRIM(`adminReply`) <> '';

-- AddForeignKey
ALTER TABLE `SupportTicketMessage`
  ADD CONSTRAINT `SupportTicketMessage_ticketId_fkey`
  FOREIGN KEY (`ticketId`) REFERENCES `SupportTicket`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupportTicketMessage`
  ADD CONSTRAINT `SupportTicketMessage_authorId_fkey`
  FOREIGN KEY (`authorId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
