-- CreateTable: roles
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- Insert default system roles
INSERT INTO "roles" ("id", "name", "display_name", "description", "is_system", "created_at", "updated_at") VALUES
('550e8400-e29b-41d4-a716-446655440001', 'ADMIN', 'Administrator', 'Full system access with all permissions', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('550e8400-e29b-41d4-a716-446655440002', 'MANAGER', 'Manager', 'Manage inventory, sales, and reports', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('550e8400-e29b-41d4-a716-446655440003', 'CASHIER', 'Kasir', 'POS operations and basic functions', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add role_id column to users (nullable first)
ALTER TABLE "users" ADD COLUMN "role_id" TEXT;

-- Migrate existing user roles to new role_id
UPDATE "users" 
SET "role_id" = '550e8400-e29b-41d4-a716-446655440001' 
WHERE "role" = 'ADMIN';

UPDATE "users" 
SET "role_id" = '550e8400-e29b-41d4-a716-446655440002' 
WHERE "role" = 'MANAGER';

UPDATE "users" 
SET "role_id" = '550e8400-e29b-41d4-a716-446655440003' 
WHERE "role" = 'CASHIER';

-- Make role_id NOT NULL after data migration
ALTER TABLE "users" ALTER COLUMN "role_id" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop old role column
ALTER TABLE "users" DROP COLUMN "role";

-- Update role_permissions table
-- Add role_id column (nullable first)
ALTER TABLE "role_permissions" ADD COLUMN "role_id" TEXT;

-- Migrate existing role_permissions
UPDATE "role_permissions" 
SET "role_id" = '550e8400-e29b-41d4-a716-446655440001' 
WHERE "role" = 'ADMIN';

UPDATE "role_permissions" 
SET "role_id" = '550e8400-e29b-41d4-a716-446655440002' 
WHERE "role" = 'MANAGER';

UPDATE "role_permissions" 
SET "role_id" = '550e8400-e29b-41d4-a716-446655440003' 
WHERE "role" = 'CASHIER';

-- Make role_id NOT NULL
ALTER TABLE "role_permissions" ALTER COLUMN "role_id" SET NOT NULL;

-- Add foreign key constraint with CASCADE delete
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old unique constraint and column (check actual constraint name first)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_role_menuPath_key') THEN
        ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_role_menuPath_key";
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_role_menu_path_key') THEN
        ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_role_menu_path_key";
    END IF;
END $$;

ALTER TABLE "role_permissions" DROP COLUMN "role";

-- Add new unique constraint
CREATE UNIQUE INDEX "role_permissions_role_id_menu_path_key" ON "role_permissions"("role_id", "menu_path");
