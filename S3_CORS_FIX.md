# S3 CORS Configuration - Step by Step Guide

## ✅ CORS Configuration Status

**CORS is configured on your S3 bucket** with the following settings:
- Bucket: `ecommv`
- Region: `ap-southeast-1`
- AllowedOrigins: `http://localhost:3000`, `https://localhost:3000`, `http://127.0.0.1:3000`

## 🔍 If You're Still Getting Errors

### Verify CORS Configuration
1. Go to: https://s3.console.aws.amazon.com/s3/buckets/ecommv?region=ap-southeast-1&tab=permissions
2. Scroll to **Cross-origin resource sharing (CORS)**
3. Verify it matches the configuration below:

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

### Troubleshooting Steps
1. **Wait 1-2 minutes** after CORS changes (they take time to propagate)
2. **Hard refresh** your browser (Ctrl+Shift+R or Cmd+Shift+R)
3. **Clear browser cache** and cookies for localhost
4. **Check browser console** (F12) for specific CORS error messages
5. **Verify your current URL** matches one of the allowed origins
6. Try uploading again

## 🔍 Verification

After configuring CORS, you can verify it's working by:
1. Opening browser DevTools (F12)
2. Going to Network tab
3. Try uploading an image
4. Check if the request to S3 succeeds (status 200)

## 📝 For Production

When deploying to production, update the `AllowedOrigins` array to include your production domain:

```json
"AllowedOrigins": [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
    "http://localhost:3000"
]
```

## 🐛 Troubleshooting

### Still getting errors after CORS configuration?

1. **Wait a few minutes**: CORS changes can take 1-2 minutes to propagate
2. **Clear browser cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. **Check the exact origin**: Open browser console and check what origin is being used
4. **Verify bucket name**: Make sure you're editing the correct bucket (`ecommv`)
5. **Check region**: Make sure your bucket region matches your AWS_REGION env variable

### Common Issues:

- **403 Forbidden**: CORS not configured or incorrect origins
- **Network Error**: CORS misconfiguration or network issue
- **Timeout**: S3 might be slow, try again

## 📞 Still Need Help?

Check the browser console for specific error messages. The improved error handling will now show detailed information about what went wrong.

