-- CreateEnum
CREATE TYPE "ReturnCondition" AS ENUM ('CLEAN', 'MINOR_DAMAGE', 'MAJOR_DAMAGE');

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "signedConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "signerName" TEXT;

-- AlterTable
ALTER TABLE "Otp" ADD COLUMN     "failedAttempts" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ReturnInspection" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "inspectorId" TEXT NOT NULL,
    "condition" "ReturnCondition" NOT NULL,
    "notes" TEXT,
    "inspectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturnInspection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReturnInspection_bookingId_key" ON "ReturnInspection"("bookingId");

-- CreateIndex
CREATE INDEX "ReturnInspection_inspectorId_idx" ON "ReturnInspection"("inspectorId");

-- AddForeignKey
ALTER TABLE "ReturnInspection" ADD CONSTRAINT "ReturnInspection_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnInspection" ADD CONSTRAINT "ReturnInspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
