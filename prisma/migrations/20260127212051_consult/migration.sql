-- CreateTable
CREATE TABLE `ConsultSession` (
    `id` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `consultantId` INTEGER NULL,
    `status` ENUM('WAITING', 'CONNECTED', 'ENDED') NOT NULL DEFAULT 'WAITING',

    INDEX `ConsultSession_userId_idx`(`userId`),
    INDEX `ConsultSession_consultantId_idx`(`consultantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConsultMessage` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `seq` INTEGER NOT NULL,
    `senderRole` ENUM('USER', 'CONSULTANT') NOT NULL,
    `content` TEXT NOT NULL,

    INDEX `ConsultMessage_sessionId_idx`(`sessionId`),
    UNIQUE INDEX `ConsultMessage_sessionId_seq_key`(`sessionId`, `seq`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ConsultMessage` ADD CONSTRAINT `ConsultMessage_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `ConsultSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
