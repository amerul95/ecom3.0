# Backend API Documentation

Secure backend implementation for CRM item management with Auth.js, Prisma, and S3 uploads.

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Auth.js v5** (Credentials provider with bcrypt, JWT sessions)
- **Prisma** + PostgreSQL
- **Zod** for validation
- **AWS SDK v3** for S3 presigned uploads

## Quick Start

1. **Set up environment variables** (see `.env.example`)
2. **Run database migrations**: `npm run db:push`
3. **Seed database**: `npm run db:seed`
4. **Start dev server**: `npm run dev`

The API endpoints are ready at `/api/items` and `/api/upload/presign`.

## Prerequisites

- Node.js 18+
- PostgreSQL database
- AWS S3 bucket (for image uploads)

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ecom_db?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="your-secret-key-here" # Generate with: openssl rand -base64 32

# Google OAuth (optional but recommended)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AWS S3
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="your-bucket-name"
```

### Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env` file

For production, add: `https://yourdomain.com/api/auth/callback/google`

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (or use migrations)
npm run db:push

# Run seed script to create admin user and sample data
npm run db:seed
```

### 3. Default Credentials

After seeding:
- **Admin**: `admin@example.com` / `admin123`
- **User**: `user@example.com` / `user123`

## API Endpoints

### Authentication

Auth.js v5 handles authentication with two providers:
- **Credentials** (email/password)
- **Google OAuth**

**Available Auth Endpoints:**
- **POST `/api/auth/signin`** - Sign in with credentials or OAuth
- **GET `/api/auth/session`** - Get current session
- **POST `/api/auth/signout`** - Sign out

**Sign in with credentials:**
```typescript
import { signIn } from "next-auth/react";

await signIn("credentials", {
  email: "admin@example.com",
  password: "admin123",
  redirect: false,
});
```

**Sign in with Google:**
```typescript
await signIn("google", {
  callbackUrl: "/",
});
```

**Get session:**
```typescript
import { getSession } from "next-auth/react";

const session = await getSession();
```

The login page (`/login`) includes both email/password and Google sign-in options.

### Items API

All endpoints require authentication (JWT session).

#### GET `/api/items`
List items with pagination.

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

**Response:**
```json
{
  "items": [
    {
      "id": "clx...",
      "title": "Premium Coffee Mug",
      "type": "DRINKWARE",
      "price": "29.99",
      "colors": ["White", "Black"],
      "images": [],
      "ownerId": "clx...",
      "owner": {
        "id": "clx...",
        "email": "admin@example.com",
        "name": "Admin User"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "pages": 1
  }
}
```

**RBAC:**
- `USER`: Only sees own items
- `ADMIN`: Sees all items

#### POST `/api/items`
Create a new item.

**Request:**
```json
{
  "title": "New Item",
  "type": "DRINKWARE",
  "price": 29.99,
  "colors": ["Red", "Blue"],
  "images": ["https://s3.amazonaws.com/..."]
}
```

**Validation:**
- `title`: 3-80 characters
- `type`: `DRINKWARE` | `APPAREL` | `ACCESSORY` | `OTHER`
- `price`: ≥ 0
- `colors`: Array of strings (optional)
- `images`: Array of S3 URLs (optional)

#### GET `/api/items/[id]`
Get a single item by ID.

**RBAC:**
- `USER`: Can only access own items
- `ADMIN`: Can access any item

#### PATCH `/api/items/[id]`
Update an item (partial update).

**Request:**
```json
{
  "title": "Updated Title",
  "price": 39.99
}
```

**RBAC:**
- `USER`: Can only update own items
- `ADMIN`: Can update any item

#### DELETE `/api/items/[id]`
Delete an item.

**RBAC:**
- `USER`: Can only delete own items
- `ADMIN`: Can delete any item

### Upload API

#### POST `/api/upload/presign`
Get a presigned URL for direct S3 upload.

**Request:**
```json
{
  "filename": "image.jpg",
  "contentType": "image/jpeg"
}
```

**Response:**
```json
{
  "presignedUrl": "https://s3.amazonaws.com/...",
  "key": "uploads/user-id/uuid.jpg",
  "publicUrl": "https://bucket.s3.region.amazonaws.com/uploads/...",
  "method": "PUT"
}
```

**Frontend Upload Flow:**

1. Request presigned URL:
```typescript
const response = await fetch('/api/upload/presign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filename: file.name,
    contentType: file.type,
  }),
});
const { presignedUrl, publicUrl } = await response.json();
```

2. Upload directly to S3:
```typescript
await fetch(presignedUrl, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': file.type,
  },
  mode: 'cors', // Required for browser uploads
});
```

**Note:** S3 bucket CORS must be configured to allow browser uploads. Current configuration:
- AllowedOrigins: `http://localhost:3000`, `https://localhost:3000`, `http://127.0.0.1:3000`
- Bucket: `ecommv`
- Region: `ap-southeast-1`

3. Use `publicUrl` in item creation:
```typescript
await fetch('/api/items', {
  method: 'POST',
  body: JSON.stringify({
    title: 'Item',
    type: 'DRINKWARE',
    price: 29.99,
    images: [publicUrl],
  }),
});
```

## Data Model

### User
- `id`: String (cuid)
- `email`: String (unique)
- `password`: String (bcrypt hashed)
- `role`: `USER` | `ADMIN`
- `name`: String?
- `image`: String?

### Item
- `id`: String (cuid)
- `title`: String (3-80 chars)
- `type`: `DRINKWARE` | `APPAREL` | `ACCESSORY` | `OTHER`
- `price`: Decimal(10,2) ≥ 0
- `colors`: String[]
- `images`: String[] (S3 URLs)
- `ownerId`: String → User.id
- `createdAt`: DateTime
- `updatedAt`: DateTime

## RBAC (Role-Based Access Control)

- **USER**: Can create, read, update, delete own items
- **ADMIN**: Can manage all items (full CRUD on any item)

## Validation

All mutations use Zod schemas:
- Item creation/update: `itemSchema` / `itemUpdateSchema`
- Upload: `uploadSchema`
- IDs: `itemIdSchema`

## Security

- **Authentication**: JWT sessions via Auth.js
- **Password Hashing**: bcrypt (10 rounds)
- **Authorization**: RBAC middleware
- **Validation**: Zod schemas on all inputs
- **S3 Uploads**: Presigned URLs (1-hour expiration)

## Development

### Run Prisma Studio
```bash
npm run db:studio
```

### Create Migration
```bash
npm run db:migrate
```

### Reset Database (⚠️ destructive)
```bash
npx prisma migrate reset
npm run db:seed
```

## Frontend Integration

### Example: Authenticated Request

```typescript
// Using fetch with session cookie
const response = await fetch('/api/items', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Example: Using Next.js Server Actions

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getItems() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Unauthorized');
  
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/items`, {
    headers: {
      Cookie: `next-auth.session-token=${session.sessionToken}`,
    },
  });
  return res.json();
}
```

## Testing

### Manual Test Cases

1. **Auth Redirect**: Unauthenticated request to `/api/items` → 401
2. **Validation**: Invalid item data → 400 with Zod errors
3. **RBAC**: User tries to update another user's item → 403
4. **Admin Access**: Admin can access any item → 200

## Troubleshooting

### Database Connection
```bash
# Test connection
npx prisma db pull
```

### Auth Issues
- Ensure `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Verify session cookies are being sent

### S3 Upload Issues
- Verify AWS credentials
- Check bucket permissions
- Ensure CORS is configured on S3 bucket

## Next Steps

- [ ] Add OAuth providers (Google, GitHub)
- [ ] Add Upstash Ratelimit
- [ ] Add comprehensive tests
- [ ] Add API documentation (OpenAPI/Swagger)
- [ ] Add image optimization/processing

