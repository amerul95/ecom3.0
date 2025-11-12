-- Step 1: Update existing user data first
UPDATE "User" SET role = 'BUYER' WHERE role = 'USER';
UPDATE "User" SET role = 'SELLER' WHERE role = 'ADMIN';

-- Step 2: Drop the old enum (if it exists)
-- Note: This will fail if there are still references, so we update data first above

-- Step 3: Create new enum with BUYER and SELLER
-- PostgreSQL doesn't allow direct enum modification, so we need to:
-- 1. Create new enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role_new') THEN
        CREATE TYPE "Role_new" AS ENUM ('BUYER', 'SELLER');
    END IF;
END $$;

-- 2. Update column to use new enum
ALTER TABLE "User" ALTER COLUMN role TYPE "Role_new" USING role::text::"Role_new";

-- 3. Drop old enum and rename new one
DROP TYPE IF EXISTS "Role";
ALTER TYPE "Role_new" RENAME TO "Role";

-- Step 4: Add composite unique constraint
ALTER TABLE "User" ADD CONSTRAINT "User_email_role_key" UNIQUE (email, role);









