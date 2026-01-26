-- CreateTable
CREATE TABLE `Plan` (
    `id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL,
    `data_amount_mb` INTEGER NOT NULL,
    `overage_speed_mbps` DECIMAL(6, 2) NOT NULL,
    `voice_minutes` INTEGER NOT NULL,
    `sms_included` INTEGER NOT NULL,
    `network_type` VARCHAR(191) NOT NULL,
    `subscription_services` JSON NOT NULL,
    `badges` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subscribe` (
    `id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL,
    `monthly_price` INTEGER NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `benefits` JSON NOT NULL,
    `description` TEXT NOT NULL,
    `badges` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
