# S3 CORS Configuration Guide

If you're getting "Failed to fetch" errors when uploading images, you need to configure CORS on your S3 bucket.

## Steps to Configure CORS

1. Go to AWS S3 Console
2. Select your bucket (`ecommv`)
3. Go to **Permissions** tab
4. Scroll down to **Cross-origin resource sharing (CORS)**
5. Click **Edit** and paste the following configuration:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
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

**Current Configuration:**
- ✅ Bucket: `ecommv`
- ✅ Region: `ap-southeast-1`
- ✅ AllowedOrigins: `http://localhost:3000`, `https://localhost:3000`, `http://127.0.0.1:3000`

**For Production:**
- Add your production domain to `AllowedOrigins` (e.g., `https://yourdomain.com`)
- Keep localhost origins for development

## Verify CORS is Working

After configuring CORS, test the upload again. The improved error messages will now tell you:
- If it's a CORS issue (403 error)
- If it's a network issue
- If it's a file format issue

## Common Issues

1. **403 Forbidden**: CORS not configured or incorrect origins
2. **Network Error**: Check internet connection or S3 bucket accessibility
3. **400 Bad Request**: File might be corrupted or too large

## Testing

You can test the S3 connection using:
```bash
npx tsx scripts/test-s3-connection.ts
```

This will verify your S3 credentials and bucket access.

