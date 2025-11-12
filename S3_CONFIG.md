# S3 Bucket Configuration Summary

## Current Configuration

### Bucket Details
- **Bucket Name**: `ecommv`
- **Region**: `ap-southeast-1` (Singapore)
- **Status**: ✅ Active and accessible

### CORS Configuration ✅

Your S3 bucket CORS is configured with the following settings:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": [
            "http://localhost:3000",
            "https://localhost:3000",
            "http://127.0.0.1:3000"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-request-id",
            "x-amz-id-2"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

### Environment Variables
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET_NAME=ecommv
```

## Testing

### Test S3 Connection
```bash
npx tsx scripts/test-s3-connection.ts
```

### Test Upload & Retrieve
```bash
npx tsx scripts/test-s3-upload-retrieve.ts
```

### Test CORS Configuration
```bash
npx tsx scripts/test-s3-cors.ts
```

## Upload Flow

1. **Frontend** requests presigned URL from `/api/upload/presign`
2. **Backend** generates presigned URL using AWS SDK
3. **Frontend** uploads directly to S3 using presigned URL
4. **S3** validates CORS and accepts the upload
5. **Frontend** receives public URL for the uploaded file

## Troubleshooting

### If Uploads Fail

1. **Check CORS Configuration**
   - Go to: https://s3.console.aws.amazon.com/s3/buckets/ecommv?region=ap-southeast-1&tab=permissions
   - Verify CORS matches the configuration above

2. **Wait for Propagation**
   - CORS changes can take 1-2 minutes to propagate

3. **Clear Browser Cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

4. **Check Browser Console**
   - Open DevTools (F12) → Network tab
   - Look for CORS errors in the console

5. **Verify Origin**
   - Make sure your current URL matches one of the AllowedOrigins

## For Production

When deploying to production, update CORS AllowedOrigins to include your production domain:

```json
"AllowedOrigins": [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
    "http://localhost:3000"  // Keep for development
]
```

## Security Notes

- ✅ Bucket is private (public URLs return 403 - this is correct)
- ✅ Presigned URLs expire after 1 hour
- ✅ Uploads are authenticated via NextAuth session
- ✅ Each user's uploads are stored in `uploads/{userId}/` folder

## Related Files

- Upload API: `app/api/upload/presign/route.ts`
- S3 Library: `lib/s3.ts`
- Upload Forms:
  - `app/seller/dashboard/items/new/page.tsx`
  - `app/seller/products/new/page.tsx`




