-- AlterTable
ALTER TABLE "products" ADD COLUMN     "base_unit" TEXT NOT NULL DEFAULT 'pcs',
ADD COLUMN     "price_per_unit" JSONB,
ADD COLUMN     "purchase_unit" TEXT NOT NULL DEFAULT 'pcs',
ADD COLUMN     "purchase_unit_qty" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "sale_units" TEXT[] DEFAULT ARRAY['pcs']::TEXT[];
