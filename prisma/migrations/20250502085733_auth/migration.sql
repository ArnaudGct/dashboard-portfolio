-- CreateTable
CREATE TABLE `autre` (
    `id_autre` INTEGER NOT NULL AUTO_INCREMENT,
    `titre` VARCHAR(100) NOT NULL,
    `description` VARCHAR(3500) NOT NULL,
    `miniature` VARCHAR(500) NOT NULL,
    `lien_github` VARCHAR(500) NOT NULL,
    `lien_figma` VARCHAR(500) NOT NULL,
    `lien_site` VARCHAR(500) NOT NULL,
    `categorie` VARCHAR(50) NOT NULL,
    `tags` VARCHAR(50) NOT NULL,
    `date` DATE NOT NULL,
    `afficher` BOOLEAN NOT NULL,

    PRIMARY KEY (`id_autre`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `autre_tags` (
    `id_tags` INTEGER NOT NULL AUTO_INCREMENT,
    `titre` VARCHAR(50) NOT NULL,
    `important` BOOLEAN NOT NULL,

    PRIMARY KEY (`id_tags`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `autre_tags_link` (
    `id_autre` INTEGER NOT NULL,
    `id_tags` INTEGER NOT NULL,

    INDEX `fk_autre_tags`(`id_tags`),
    PRIMARY KEY (`id_autre`, `id_tags`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `experiences` (
    `id_exp` INTEGER NOT NULL AUTO_INCREMENT,
    `date_debut` VARCHAR(50) NOT NULL,
    `date_fin` VARCHAR(10) NOT NULL,
    `titre` VARCHAR(150) NOT NULL,
    `description` VARCHAR(10000) NOT NULL,
    `url_img` VARCHAR(250) NOT NULL,
    `position_img` VARCHAR(50) NOT NULL,
    `position` VARCHAR(10) NOT NULL,
    `categorie` VARCHAR(25) NOT NULL,
    `img_logo` VARCHAR(250) NOT NULL,
    `nom_entreprise` VARCHAR(50) NOT NULL,
    `url_entreprise` VARCHAR(1000) NOT NULL,
    `type_emploi` VARCHAR(50) NOT NULL,
    `poste_actuel` INTEGER NOT NULL,
    `afficher` BOOLEAN NOT NULL,

    PRIMARY KEY (`id_exp`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `faq` (
    `id_faq` INTEGER NOT NULL AUTO_INCREMENT,
    `titre` VARCHAR(250) NOT NULL,
    `contenu` VARCHAR(1000) NOT NULL,
    `afficher` BOOLEAN NOT NULL,

    PRIMARY KEY (`id_faq`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `photos` (
    `id_pho` INTEGER NOT NULL AUTO_INCREMENT,
    `lien_high` VARCHAR(500) NOT NULL,
    `lien_low` VARCHAR(500) NOT NULL,
    `largeur` INTEGER NOT NULL,
    `hauteur` INTEGER NOT NULL,
    `alt` VARCHAR(500) NOT NULL,
    `date` DATETIME(0) NOT NULL,
    `afficher` BOOLEAN NOT NULL,

    PRIMARY KEY (`id_pho`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `photos_albums` (
    `id_alb` INTEGER NOT NULL AUTO_INCREMENT,
    `titre` VARCHAR(100) NOT NULL,
    `description` VARCHAR(1000) NOT NULL,
    `date` DATE NOT NULL,
    `afficher` BOOLEAN NOT NULL,

    PRIMARY KEY (`id_alb`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `photos_albums_link` (
    `id_pho` INTEGER NOT NULL,
    `id_alb` INTEGER NOT NULL,

    INDEX `fk_photos_albums`(`id_alb`),
    PRIMARY KEY (`id_pho`, `id_alb`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `photos_albums_tags_link` (
    `id_alb` INTEGER NOT NULL,
    `id_tags` INTEGER NOT NULL,

    INDEX `fk_photos_albums_tags`(`id_tags`),
    PRIMARY KEY (`id_alb`, `id_tags`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `photos_experiences` (
    `id_photo` INTEGER NOT NULL AUTO_INCREMENT,
    `titre` VARCHAR(100) NOT NULL,
    `url` VARCHAR(1000) NOT NULL,
    `date` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id_photo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `photos_tags` (
    `id_tags` INTEGER NOT NULL AUTO_INCREMENT,
    `titre` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id_tags`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `photos_tags_link` (
    `id_pho` INTEGER NOT NULL,
    `id_tags` INTEGER NOT NULL,

    INDEX `fk_photos_tags`(`id_tags`),
    PRIMARY KEY (`id_pho`, `id_tags`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `photos_tags_recherche` (
    `id_tags` INTEGER NOT NULL AUTO_INCREMENT,
    `titre` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id_tags`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `photos_tags_recherche_link` (
    `id_pho` INTEGER NOT NULL,
    `id_tags` INTEGER NOT NULL,

    INDEX `fk_photos_tags_recherche`(`id_tags`),
    PRIMARY KEY (`id_pho`, `id_tags`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `temoignages` (
    `id_tem` INTEGER NOT NULL AUTO_INCREMENT,
    `contenu` VARCHAR(500) NOT NULL,
    `client` VARCHAR(50) NOT NULL,
    `plateforme` VARCHAR(50) NOT NULL,
    `date` VARCHAR(50) NULL,
    `afficher` BOOLEAN NOT NULL,

    PRIMARY KEY (`id_tem`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `utilisateurs` (
    `id_user` INTEGER NOT NULL AUTO_INCREMENT,
    `img` VARCHAR(250) NOT NULL,
    `email` VARCHAR(50) NULL,
    `username` VARCHAR(50) NOT NULL,
    `password` VARCHAR(50) NOT NULL,
    `role` VARCHAR(10) NOT NULL,

    PRIMARY KEY (`id_user`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `videos` (
    `id_vid` INTEGER NOT NULL AUTO_INCREMENT,
    `titre` VARCHAR(100) NOT NULL,
    `description` VARCHAR(3500) NOT NULL,
    `tags` VARCHAR(50) NOT NULL,
    `lien` VARCHAR(500) NOT NULL,
    `date` VARCHAR(50) NOT NULL,
    `media_webm` VARCHAR(100) NOT NULL,
    `media_mp4` VARCHAR(100) NOT NULL,
    `duree` VARCHAR(25) NOT NULL,
    `afficher_competences` VARCHAR(50) NOT NULL,
    `afficher` BOOLEAN NOT NULL,
    `derniere_modification` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id_vid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `videos_tags` (
    `id_tags` INTEGER NOT NULL AUTO_INCREMENT,
    `titre` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id_tags`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `videos_tags_link` (
    `id_vid` INTEGER NOT NULL,
    `id_tags` INTEGER NOT NULL,

    INDEX `fk_videos_tags`(`id_tags`),
    PRIMARY KEY (`id_vid`, `id_tags`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `name` TEXT NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `emailVerified` BOOLEAN NOT NULL,
    `image` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session` (
    `id` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `ipAddress` TEXT NULL,
    `userAgent` TEXT NULL,
    `userId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `session_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` TEXT NOT NULL,
    `providerId` TEXT NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `accessToken` TEXT NULL,
    `refreshToken` TEXT NULL,
    `idToken` TEXT NULL,
    `accessTokenExpiresAt` DATETIME(3) NULL,
    `refreshTokenExpiresAt` DATETIME(3) NULL,
    `scope` TEXT NULL,
    `password` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification` (
    `id` VARCHAR(191) NOT NULL,
    `identifier` TEXT NOT NULL,
    `value` TEXT NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `autre_tags_link` ADD CONSTRAINT `fk_autre` FOREIGN KEY (`id_autre`) REFERENCES `autre`(`id_autre`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `autre_tags_link` ADD CONSTRAINT `fk_autre_tags` FOREIGN KEY (`id_tags`) REFERENCES `autre_tags`(`id_tags`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `photos_albums_link` ADD CONSTRAINT `fk_photos2` FOREIGN KEY (`id_pho`) REFERENCES `photos`(`id_pho`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `photos_albums_link` ADD CONSTRAINT `fk_photos_albums` FOREIGN KEY (`id_alb`) REFERENCES `photos_albums`(`id_alb`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `photos_albums_tags_link` ADD CONSTRAINT `fk_album` FOREIGN KEY (`id_alb`) REFERENCES `photos_albums`(`id_alb`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `photos_albums_tags_link` ADD CONSTRAINT `fk_photos_albums_tags` FOREIGN KEY (`id_tags`) REFERENCES `photos_tags`(`id_tags`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `photos_tags_link` ADD CONSTRAINT `fk_photos` FOREIGN KEY (`id_pho`) REFERENCES `photos`(`id_pho`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `photos_tags_link` ADD CONSTRAINT `fk_photos_tags` FOREIGN KEY (`id_tags`) REFERENCES `photos_tags`(`id_tags`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `photos_tags_recherche_link` ADD CONSTRAINT `fk_photos3` FOREIGN KEY (`id_pho`) REFERENCES `photos`(`id_pho`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `photos_tags_recherche_link` ADD CONSTRAINT `fk_photos_tags_recherche` FOREIGN KEY (`id_tags`) REFERENCES `photos_tags_recherche`(`id_tags`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `videos_tags_link` ADD CONSTRAINT `fk_videos` FOREIGN KEY (`id_vid`) REFERENCES `videos`(`id_vid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `videos_tags_link` ADD CONSTRAINT `fk_videos_tags` FOREIGN KEY (`id_tags`) REFERENCES `videos_tags`(`id_tags`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session` ADD CONSTRAINT `session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account` ADD CONSTRAINT `account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
