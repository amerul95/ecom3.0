# Refactoring: Seller to Admin - Complete Guide

## Objective
Change the app from **BUYER + SELLER** model to **BUYER + ADMIN** model, where:
- **BUYER**: Can browse and purchase products
- **ADMIN**: Manages all products (single seller model)

## ✅ Completed Changes

### 1. **Database Schema** (`prisma/schema.prisma`)
- ✅ Updated SellerProfile comment to indicate ADMIN role
- ✅ Changed `verified` default to `true` (admin is always verified)

### 2. **Auth Helpers** (`lib/auth-helpers.ts`)
- ✅ `requireSeller()` now redirects to `requireAdmin()`
- ✅ `requireBuyer()` allows ADMIN access
- ✅ `canManageProduct()` now only checks for ADMIN role

### 3. **API Routes Created**
- ✅ `/app/api/admin/products/route.ts` - GET/POST products
- ✅ `/app/api/admin/products/[id]/route.ts` - GET/PATCH/DELETE product

### 4. **Frontend Pages Created**
- ✅ `/app/admin/dashboard/page.tsx` - Admin dashboard
- ✅ `/app/admin/products/page.tsx` - Products list
- ✅ `/app/admin/components/Sidebar.tsx` - Admin sidebar

### 5. **Seed File** (`prisma/seed.ts`)
- ✅ Changed seller user to admin user
- ✅ Updated seller profile creation for admin

## 🔄 Remaining Changes Needed

### 1. **Copy Remaining Pages**
Copy and update these pages from `/seller/*` to `/admin/*`:

**Pages to Copy:**
- `/app/seller/products/new/page.tsx` → `/app/admin/products/new/page.tsx`
- `/app/seller/products/[id]/edit/page.tsx` → `/app/admin/products/[id]/edit/page.tsx`
- `/app/seller/dashboard/items/new/page.tsx` → `/app/admin/dashboard/items/new/page.tsx` (if needed)

**Update in each file:**
- Change `/api/seller/*` → `/api/admin/*`
- Change `/seller/*` routes → `/admin/*`
- Change `session?.user?.role !== 'SELLER'` → `session?.user?.role !== 'ADMIN'`
- Change `requireSeller()` → `requireAdmin()`
- Update text: "Seller" → "Admin", "My Products" → "Products"

### 2. **Update All API References**

**Search and replace in all files:**
```typescript
// Old
'/api/seller/products'
requireSeller()
session?.user?.role !== 'SELLER'
router.push('/seller/login')

// New
'/api/admin/products'
requireAdmin()
session?.user?.role !== 'ADMIN'
router.push('/login')
```

### 3. **Remove Seller Routes** (Optional)
After confirming admin routes work:
- Delete `/app/seller/` directory
- Delete `/app/api/seller/` directory
- Delete `/app/seller/login` and `/app/seller/signup` pages

### 4. **Update Navigation/Links**
Search for all references to `/seller/*` and update to `/admin/*`:
- Sidebar links
- Navigation menus
- Button links
- Redirect URLs

## 📋 Files That Need Updates

### Frontend Pages:
1. ✅ `/app/admin/dashboard/page.tsx` - Created
2. ✅ `/app/admin/products/page.tsx` - Created
3. ⏳ `/app/admin/products/new/page.tsx` - Need to copy from seller
4. ⏳ `/app/admin/products/[id]/edit/page.tsx` - Need to copy from seller

### API Routes:
1. ✅ `/app/api/admin/products/route.ts` - Created
2. ✅ `/app/api/admin/products/[id]/route.ts` - Created

### Other Files:
- ⏳ Update any components that reference seller routes
- ⏳ Update upload presign route if it checks for seller
- ⏳ Update any middleware or redirects

## 🧪 Testing Checklist

After refactoring:
- [ ] Admin can login
- [ ] Admin can access `/admin/dashboard`
- [ ] Admin can view products at `/admin/products`
- [ ] Admin can create products at `/admin/products/new`
- [ ] Admin can edit products at `/admin/products/[id]/edit`
- [ ] Admin can delete products
- [ ] Buyer cannot access admin routes
- [ ] All API calls use `/api/admin/*` instead of `/api/seller/*`

## 🎯 Summary

**Current Status:**
- ✅ Database schema updated
- ✅ Auth helpers updated
- ✅ Admin API routes created
- ✅ Admin dashboard and products list created
- ⏳ Need to copy remaining pages (new, edit)
- ⏳ Need to update all references from seller to admin

**Next Steps:**
1. Copy seller product pages to admin
2. Update all API references
3. Test admin functionality
4. Remove old seller routes (optional)
