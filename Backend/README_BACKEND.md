# Backend Setup Instructions

## Issues Found and Resolved

### 1. Environment Variables Problem
- **Issue**: The `.env` file had formatting issues with Windows line endings (`\r\n`) causing environment variables to not load properly
- **Resolution**: Recreated the `.env` file with proper formatting

### 2. MongoDB Connection Issue
- **Issue**: The MongoDB Atlas cluster name `dhraec0` appears to be incorrect or inaccessible
- **Error**: `querySrv ECONNREFUSED _mongodb._tcp.mbusiness.dhraec0.mongodb.net`
- **Status**: This appears to be a network/DNS issue with the MongoDB Atlas cluster

## Current Status

✅ **Environment variables**: Now properly configured  
✅ **Cloudinary**: Successfully configured  
❌ **MongoDB**: Connection failing due to DNS/network issues  

## Solutions to Try

### Option 1: Fix MongoDB Atlas Connection
1. Check your MongoDB Atlas dashboard
2. Verify the cluster name and connection string
3. Ensure your IP is whitelisted in Atlas
4. Update the `.env` file with the correct connection string

### Option 2: Use Local MongoDB (for development)
1. Install MongoDB locally
2. Update `.env` with: `MONGO_URI=mongodb://localhost:27017/mbusiness`
3. Start MongoDB service

### Option 3: Use a Different MongoDB Atlas Cluster
1. Create a new cluster in MongoDB Atlas
2. Update the connection string in `.env`

## Environment Variables Template

See `.env.example` for the required format. Update it with your actual credentials:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## To Start the Backend

```bash
cd Backend
npm install
node server.js
```

The server should start on port 5000 once the MongoDB connection is resolved.
