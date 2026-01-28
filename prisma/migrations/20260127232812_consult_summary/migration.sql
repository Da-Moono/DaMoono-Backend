-- CreateTable
CREATE TABLE `ConsultSummary` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `audience` ENUM('USER', 'CONSULTANT') NOT NULL,
    `payload` JSON NOT NULL,
    `ticketId` VARCHAR(50) NOT NULL DEFAULT '',
    `category` VARCHAR(20) NOT NULL DEFAULT '',
    `summary` TEXT NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `promptKey` VARCHAR(50) NOT NULL DEFAULT 'user_v1',

    INDEX `ConsultSummary_sessionId_idx`(`sessionId`),
    INDEX `ConsultSummary_audience_idx`(`audience`),
    INDEX `ConsultSummary_ticketId_idx`(`ticketId`),
    INDEX `ConsultSummary_category_idx`(`category`),
    UNIQUE INDEX `ConsultSummary_sessionId_audience_version_key`(`sessionId`, `audience`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ConsultSummary` ADD CONSTRAINT `ConsultSummary_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `ConsultSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
