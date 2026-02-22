/*
  Warnings:

  - You are about to drop the `debt_payments` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'SPLIT';

-- DropForeignKey
ALTER TABLE "debt_payments" DROP CONSTRAINT "debt_payments_transaction_id_fkey";

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "transaction_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "size" TEXT;

-- DropTable
DROP TABLE "debt_payments";

-- CreateTable
CREATE TABLE "transaction_payments" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "transaction_payments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "transaction_payments" ADD CONSTRAINT "transaction_payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
