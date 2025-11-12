# Database Migration Guide: USER/ADMIN/SELLER → BUYER/SELLER

## Problem
The database still has the old Role enum (USER, ADMIN, SELLER) but the code expects (BUYER, SELLER).

## Solution

You have two options:

### Option 1: Manual SQL Migration (Recommended)

1. Connect to your PostgreSQL database
2. Run the SQL script in `scripts/fix-database-roles.sql`

Or run via psql:
```bash
psql $DATABASE_URL -f scripts/fix-database-roles.sql
```

### Option 2: Reset Database (Development Only)

⚠️ **WARNING: This will delete all data!**

```bash
# Reset database and regenerate schema
npx prisma migrate reset --force
npx prisma db push
npm run db:seed
```

### Option 3: Use Migration Script (TypeScript)

```bash
# First, update the enum manually via SQL, then:
npx tsx scripts/migrate-roles.ts
npx prisma db push --accept-data-loss
npx prisma generate
```

## After Migration

Once the database is updated:

```bash
# Regenerate Prisma Client
npx prisma generate

# Restart your dev server
npm run dev
```

## Verify

Check that users have correct roles:
```sql
SELECT email, role FROM "User";
```

Expected: All users should have either 'BUYER' or 'SELLER' role.










