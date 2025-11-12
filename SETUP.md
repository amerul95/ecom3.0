# Backend Setup Guide

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

**You MUST create a `.env` file** - this is required for the app to run!

1. Copy `.env.example` to `.env`:
   ```bash
   # Windows PowerShell
   Copy-Item .env.example .env
   
   # Or manually create .env file
   ```

2. Open `.env` and fill in your actual values:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ecom_db?schema=public"

# Auth (generate secret: openssl rand -base64 32)
AUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional - see setup instructions below)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AWS S3
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="your-bucket-name"
```

### 3. Set Up Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Or use migrations (recommended for production)
npm run db:migrate
```

### 4. Seed Database

Creates admin user and sample items:

```bash
npm run db:seed
```

Default credentials:
- **Admin**: `admin@example.com` / `admin123`
- **User**: `user@example.com` / `user123`

### 5. Verify Setup

```bash
# Start dev server
npm run dev

# In another terminal, test API
curl http://localhost:3000/api/items
# Should return 401 Unauthorized (expected - need auth)

# Or visit http://localhost:3000/crm/dashboard
# Should redirect to /login if not authenticated
```

## Database Management

### View Database
```bash
npm run db:studio
```
Opens Prisma Studio at http://localhost:5555

### Create Migration
```bash
npm run db:migrate
```

### Reset Database (⚠️ deletes all data)
```bash
npx prisma migrate reset
npm run db:seed
```

## Testing

Manual test cases:

1. **Auth Redirect**: Visit `/api/items` without auth → 401
2. **Validation**: POST invalid item → 400 with Zod errors
3. **RBAC**: User tries to update another user's item → 403
4. **Admin Access**: Admin can access any item → 200

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check `DATABASE_URL` format
- Test connection: `npx prisma db pull`

### Auth Issues
- Ensure `AUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cookies if session issues persist

### S3 Upload Issues
- Verify AWS credentials
- Check bucket exists and is accessible
- Ensure bucket CORS allows your domain

## Google OAuth Setup (Optional)

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable Google+ API
4. Go to "APIs & Services" → "Credentials"
5. Click "Create Credentials" → "OAuth client ID"
6. Application type: "Web application"
7. Add authorized redirect URI:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
8. Copy Client ID and Client Secret to `.env`

**Note:** Google OAuth automatically creates users if they don't exist (default role: USER)

## Next Steps

1. Connect frontend to API endpoints
2. Implement CRM dashboard UI at `/crm/dashboard`
3. Add rate limiting (Upstash Ratelimit) if needed
4. Add comprehensive tests

