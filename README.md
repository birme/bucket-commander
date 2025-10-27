# 🪣 Bucket Commander

A Norton Commander-inspired dual-pane file manager for S3 buckets, built as a modern web application.

## Screenshot

![Bucket Commander Interface](screenshot.png)

*Norton Commander-inspired dual-pane interface for S3 bucket management*

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

### Option 1: Docker Deployment (Recommended)

1. **Clone and Configure**
   ```bash
   git clone <repository-url>
   cd bucket-commander
   cp .env.example .env
   # Edit .env and set your OSC_ACCESS_TOKEN
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access Application**
   - Frontend: http://localhost:3001
   - API: http://localhost:3001/api

#### Manual Docker Build
```bash
# Build image
docker build -t bucket-commander .

# Run with volume mounting
docker run -d \
  --name bucket-commander \
  -p 3001:3001 \
  -v bucket-commander-data:/app/data \
  -e OSC_ACCESS_TOKEN=your_token_here \
  bucket-commander
```

#### Environment Variables
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OSC_ACCESS_TOKEN` | Open Source Cloud access token | - | Yes |
| `PORT` | Application port | `3001` | No |
| `DB_PATH` | Database directory | `/app/data` (Docker)<br>`~/.bucket-commander` (Local) | No |

### Option 2: Local Development

#### Prerequisites
- Node.js 18+ 
- npm or yarn

#### Installation & Development

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

#### Production Build & Deployment

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
- **Docker**: `/app/data/bucket-commander.db` (mount volume for persistence)
- **Local**: `~/.bucket-commander/bucket-commander.db` (or custom path via `DB_PATH` env var)

For Docker deployments, use a volume to persist data:
```bash
# Named volume (recommended)
docker run -v bucket-commander-data:/app/data bucket-commander

# Bind mount to host directory
docker run -v /host/path/to/data:/app/data bucket-commander
```

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