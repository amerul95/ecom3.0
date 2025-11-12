# Fix: Categories API 500 Error

## Problem
The `/api/categories` endpoint is returning a 500 error, likely because:
1. Database migrations haven't been run
2. The Category table doesn't exist in the database
3. Prisma client needs to be regenerated

## Solution

### Step 1: Stop the Dev Server
Press `Ctrl+C` in the terminal where `npm run dev` is running.

### Step 2: Run Database Migrations
```bash
npm run db:push
```
This will sync your Prisma schema with the database, creating all necessary tables including the `Category` table.

### Step 3: Regenerate Prisma Client
```bash
npm run db:generate
```

### Step 4: Seed the Database (Optional but Recommended)
```bash
npm run db:seed
```
This will create sample categories (Electronics, Apparel, Accessories) and test data.

### Step 5: Restart Dev Server
```bash
npm run dev
```

### Step 6: Test the Categories API
Try accessing `/api/categories` again. It should work now!

## Alternative: If db:push doesn't work

If `db:push` fails, try using migrations instead:

```bash
npx prisma migrate dev --name init
```

This creates a proper migration file that you can version control.

## Verify Database Setup

You can verify your database setup by running:

```bash
npm run db:studio
```

This opens Prisma Studio where you can visually inspect your database tables and data.

## Expected Result

After running the migrations, you should see:
- ✅ Category table created
- ✅ Categories API returns: `{ categories: [...] }`
- ✅ Product form can fetch categories successfully








