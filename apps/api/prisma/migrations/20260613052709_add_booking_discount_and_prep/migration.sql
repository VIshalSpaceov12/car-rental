-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "prepReadyAt" TIMESTAMP(3);
