-- AlterTable
ALTER TABLE "products" ADD COLUMN     "batch_number" TEXT,
ADD COLUMN     "expiry_alert_days" INTEGER DEFAULT 30,
ADD COLUMN     "expiry_date" TIMESTAMP(3),
ADD COLUMN     "manufacture_date" TIMESTAMP(3);
