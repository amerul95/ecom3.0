-- Migration script to move from User table with roles to separate SellerUser table
-- Run this BEFORE pushing the new schema

-- Step 1: Create SellerUser entries for existing users with SELLER role
-- (If you have existing sellers, migrate them first)
-- Note: This assumes you've already migrated USER->BUYER and ADMIN->SELLER in User table

-- Step 2: Delete or migrate existing items
-- Option A: Delete all items (if you can lose this data)
-- DELETE FROM "Item";

-- Option B: Migrate items to SellerUser (if you have seller users)
-- This requires knowing which users are sellers
-- UPDATE "Item" SET "ownerId" = (SELECT id FROM "SellerUser" WHERE email = ...);

-- Step 3: After running this, push the new schema with:
-- npx prisma db push --accept-data-loss









