-- Update existing users with old roles to new roles
UPDATE "User" SET role = 'BUYER' WHERE role = 'USER';
UPDATE "User" SET role = 'SELLER' WHERE role = 'ADMIN';

-- Note: This is a temporary fix. The enum will be updated by Prisma schema push.









