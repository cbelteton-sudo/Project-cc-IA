/*
  Warnings:

  - You are about to drop the column `joinedAt` on the `ProjectMember` table. All the data in the column will be lost.
  - You are about to drop the column `roles` on the `ProjectMember` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `ProjectMember` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProjectRole" AS ENUM ('DIRECTOR', 'PM', 'SUPERVISOR', 'USER');

-- AlterTable
ALTER TABLE "ProjectMember" DROP COLUMN "joinedAt",
DROP COLUMN "roles",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "permissionsJson" JSONB,
ADD COLUMN     "role" "ProjectRole" NOT NULL DEFAULT 'USER',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
