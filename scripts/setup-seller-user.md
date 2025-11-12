# Setup SellerUser Table

## Steps to Fix the Error

1. **Stop the dev server** (if running)

2. **Delete existing items** (they reference old User table):
   ```sql
   DELETE FROM "Item";
   ```
   Or use: `psql $DATABASE_URL -f scripts/clean-items.sql`

3. **Push the new schema**:
   ```bash
   npx prisma db push --accept-data-loss
   ```

4. **Regenerate Prisma Client**:
   ```bash
   npx prisma generate
   ```

5. **Restart dev server**:
   ```bash
   npm run dev
   ```

## Alternative: If you can't stop the server

1. Close all terminals running the dev server
2. Close your IDE/editor
3. Run `npx prisma generate` again
4. Restart everything









