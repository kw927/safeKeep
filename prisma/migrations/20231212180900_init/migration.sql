/*
  Warnings:

  - You are about to drop the column `salt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `User` DROP COLUMN `salt`,
    DROP COLUMN `username`,
    MODIFY `totp_secret` VARCHAR(191) NULL;
