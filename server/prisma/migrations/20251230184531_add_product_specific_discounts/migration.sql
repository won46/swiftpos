-- AlterTable
ALTER TABLE "discounts" ADD COLUMN     "applicable_products" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "category_id" INTEGER;

-- AddForeignKey
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
