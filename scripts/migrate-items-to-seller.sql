-- Migration: Move existing items to SellerUser
-- This script assumes you have SellerUser records created

-- First, create SellerUser records for existing sellers (if any)
-- Then migrate items:

-- Option 1: If all items should belong to a specific seller
-- UPDATE "Item" SET "ownerId" = (SELECT id FROM "SellerUser" LIMIT 1);

-- Option 2: Delete all items (safest for fresh start)
DELETE FROM "Item";

-- After this, you can push the schema safely









