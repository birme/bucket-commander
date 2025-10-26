# 🪣 Bucket Commander

A Norton Commander-inspired dual-pane file manager for S3 buckets, built as a modern web application.

## Architecture

This application consists of two main components:

### Frontend (React + TypeScript)
- **Location**: `./` (root directory)
- **Port**: 5173 (development)
- **Technology**: React, TypeScript, Styled Components, Vite

### Backend (Node.js + Express)
- **Location**: `./backend/`
- **Port**: 3001
- **Technology**: Express, TypeScript, SQLite (better-sqlite3), AWS SDK v3

## Features

- ✅ **Dual-Pane Interface**: Norton Commander-inspired layout with left and right file panes
- ✅ **S3 Credential Management**: Securely store and manage AWS S3 credentials
- ✅ **Bucket Browsing**: Navigate through S3 buckets, folders, and files
- ✅ **Connection Testing**: Validate credentials when adding/updating bucket configurations
- ✅ **Persistent Storage**: SQLite database for credential storage
- 🚧 **File Operations**: Future support for S3-to-S3 copying via Open Source Cloud services

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation & Development

1. **Install All Dependencies**
   ```bash
   npm run install:all
   ```

2. **Development Mode** (with hot reloading)
   ```bash
   npm run dev
   ```
   Both frontend and backend will run integrated on http://localhost:3001

   Alternative: Run frontend and backend separately:
   ```bash
   # Terminal 1 - Backend with hot reload
   npm run dev:backend
   
   # Terminal 2 - Frontend with hot reload  
   npm run dev:frontend
   ```

### Production Build & Deployment

1. **Build Everything**
   ```bash
   npm run build
   ```

2. **Start Production Server**
   ```bash
   npm start
   ```
   Application runs on http://localhost:3001 (configurable with PORT env var)

## API Endpoints

### Credentials
- `GET /api/credentials` - List all credentials
- `POST /api/credentials` - Create new credential
- `GET /api/credentials/:id` - Get credential by ID
- `PUT /api/credentials/:id` - Update credential
- `DELETE /api/credentials/:id` - Delete credential

### S3 Operations
- `GET /api/s3/:credentialId/objects` - List objects in bucket
- `GET /api/s3/:credentialId/test` - Test connection

### Health Check
- `GET /api/health` - API health status

## Database

The application uses SQLite for persistent storage of S3 credentials. The database file is created at:
- **Development/Production**: `~/.bucket-commander/bucket-commander.db`

## Future Enhancements

- S3-to-S3 file copying using Open Source Cloud services
- File preview functionality
- Bulk operations
- Search and filtering
- Keyboard shortcuts (F1-F10 functions)

## Security Notes

- Credentials are stored locally in SQLite
- All S3 operations go through the backend API
- No credentials are sent to the frontend
- CORS is configured for local development