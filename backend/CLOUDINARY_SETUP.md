# Cloudinary Setup Guide

## Overview
This project now uses Cloudinary for file storage instead of local filesystem. All CV/resume uploads are stored in Cloudinary and accessed via Cloudinary URLs.

## Required Environment Variables

Add these to your `.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Getting Cloudinary Credentials

1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Go to Dashboard
3. Copy your `Cloud Name`, `API Key`, and `API Secret`
4. Add them to your `.env` file

## File Organization in Cloudinary

- **Resumes**: Stored in `staffdox/resumes/` folder
- **CVs**: Stored in `staffdox/cvs/` folder

## Migration Notes

### Backward Compatibility
- The code still supports old file paths (`filePath`) for backward compatibility during migration
- New uploads will store Cloudinary URLs in both `filePath` and `cloudinaryUrl` fields
- The `cloudinaryUrl` field takes precedence when available

### Database Schema Changes

**CvUpload Model:**
- Added: `cloudinaryUrl` (String, required) - Primary Cloudinary URL
- Added: `cloudinaryPublicId` (String, required) - For deletion purposes
- Kept: `filePath` (String, required) - For backward compatibility

**User Model:**
- Modified: `resume` now stores Cloudinary URL
- Added: `resumeCloudinaryPublicId` (String) - For deletion purposes

## Testing

1. Upload a CV in admin dashboard - should upload to Cloudinary
2. Upload a resume in user profile - should upload to Cloudinary
3. View/download CVs - should redirect to Cloudinary URLs
4. Delete CVs/resumes - should delete from Cloudinary

## Production Deployment

1. Set all environment variables in your production environment
2. No changes needed to deployment - Cloudinary URLs work from anywhere
3. Files are automatically served by Cloudinary CDN
4. No local file storage needed

