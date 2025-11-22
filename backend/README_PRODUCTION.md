# Production Deployment Guide

This guide will help you deploy the Staffdox backend to production.

## Prerequisites

- Node.js 18+ installed
- MongoDB database (local or cloud)
- PM2 installed globally: `npm install -g pm2`
- Environment variables configured

## Installation Steps

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://yourdomain.com

MONGO_URI=mongodb://your-mongodb-connection-string

JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=7d

SESSION_SECRET=your-super-secret-session-key-min-32-characters
COOKIE_SECURE=true

EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# OAuth (if using)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback

LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_CALLBACK_URL=https://yourdomain.com/api/auth/linkedin/callback

# Payment Gateway
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# SMS (Optional)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# OR MSG91
MSG91_AUTH_KEY=your-msg91-auth-key
MSG91_SENDER_ID=your-msg91-sender-id

LOG_LEVEL=info
```

**IMPORTANT**: 
- Never commit `.env` file to version control
- Use strong, random secrets (minimum 32 characters)
- In production, set `COOKIE_SECURE=true` (requires HTTPS)
- Set `NODE_ENV=production`

### 3. Create Required Directories

```bash
mkdir -p logs
mkdir -p src/uploads
```

### 4. Start with PM2

```bash
# Start the application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### 5. PM2 Commands

```bash
# View logs
pm2 logs staffdox-backend

# Restart application
pm2 restart staffdox-backend

# Stop application
pm2 stop staffdox-backend

# View status
pm2 status

# Monitor
pm2 monit
```

## Security Checklist

- [x] Helmet.js configured for security headers
- [x] Rate limiting enabled on all routes
- [x] CORS configured with specific origin
- [x] JWT secrets are strong and stored in environment variables
- [x] Session secrets are strong and stored in environment variables
- [x] File upload validation (type and size limits)
- [x] Input validation on all routes
- [x] Error handling doesn't expose sensitive information
- [x] HTTPS enabled (via reverse proxy or directly)
- [x] Database connection uses authentication
- [x] Logging configured (Winston)

## Monitoring

### Health Check

The application exposes a health check endpoint:

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

### Logs

Logs are stored in:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/pm2-*.log` - PM2 logs

### Log Levels

- `error` - Only errors
- `warn` - Warnings and errors
- `info` - Info, warnings, and errors (recommended for production)
- `debug` - All logs (development only)

## Rate Limiting

The application implements rate limiting:

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- **OTP Generation**: 3 requests per 15 minutes per IP
- **Password Reset**: 3 requests per hour per IP

## Database

### Connection Retry

The application automatically retries database connections with exponential backoff:
- Initial delay: 5 seconds
- Maximum retries: 5
- Exponential backoff: delay doubles after each retry

### MongoDB Indexes

Ensure you have indexes on frequently queried fields:
- `User.email`
- `User.phone`
- `Job.postedBy`
- `OTP.identifier`

## File Uploads

- Maximum file size: 5MB
- Allowed types: PDF, DOC, DOCX
- Files stored in: `src/uploads/`
- Filenames sanitized to prevent directory traversal

## Reverse Proxy (Nginx Example)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Troubleshooting

### Application won't start

1. Check logs: `pm2 logs staffdox-backend`
2. Verify environment variables: `pm2 env 0`
3. Check MongoDB connection
4. Verify port is not in use: `lsof -i :5000`

### High memory usage

- PM2 will auto-restart if memory exceeds 1GB
- Check for memory leaks in logs
- Consider increasing server resources

### Database connection issues

- Verify `MONGO_URI` is correct
- Check MongoDB is running and accessible
- Review connection retry logs

## Updates

To update the application:

```bash
# Pull latest code
git pull

# Install new dependencies (if any)
npm install

# Restart application
pm2 restart staffdox-backend
```

## Backup

Regularly backup:
- MongoDB database
- `src/uploads/` directory (user uploads)
- `.env` file (securely stored)

