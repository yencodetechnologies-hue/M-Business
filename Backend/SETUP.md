# Backend Setup Instructions

## Environment Configuration

The backend requires environment variables to function properly. Follow these steps:

### 1. Set up Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and update the following variables:

#### Required Variables:
- **MONGO_URI**: Your MongoDB connection string
  - Local MongoDB: `mongodb://localhost:27017/m-business`
  - MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/m-business`

#### Optional Variables:
- **PORT**: Server port (defaults to 5000)
- **CLOUDINARY_CLOUD_NAME**: For image uploads
- **CLOUDINARY_API_KEY**: For image uploads
- **CLOUDINARY_API_SECRET**: For image uploads
- **NODE_ENV**: Environment (development/production)

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Server

```bash
npm start
# or for development
npm run dev
```

## Troubleshooting

### 500 Internal Server Error on Add Project

If you're getting a 500 error when adding projects, check:

1. **Database Connection**: Ensure MongoDB is running and the MONGO_URI is correct
2. **Environment Variables**: Make sure the `.env` file exists with proper values
3. **Server Logs**: Check the console output for detailed error messages

### Common Issues

1. **Database Not Connected**: 
   - Error: "Database not connected"
   - Solution: Check MONGO_URI in .env file

2. **Missing .env File**:
   - Error: MONGO_URI undefined
   - Solution: Copy .env.example to .env and fill in values

3. **MongoDB Not Running**:
   - Error: Connection refused
   - Solution: Start MongoDB service or use MongoDB Atlas

## API Endpoints

- **POST /api/projects/add**: Add a new project
- **GET /api/projects**: Get all projects
- **PUT /api/projects/:id**: Update a project
- **DELETE /api/projects/:id**: Delete a project

## Testing the API

You can test the add project endpoint with:

```bash
curl -X POST https://m-business-r2vd.onrender.com/api/projects/add \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "client": "Test Client",
    "purpose": "Testing",
    "description": "Test description"
  }'
```
