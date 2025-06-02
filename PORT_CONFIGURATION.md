# Port Configuration Guide

This document outlines the fixed port configuration for the Resumint application to prevent port conflicts and ensure consistent development experience.

## Fixed Port Assignments

### Frontend (Next.js)
- **Port**: `8080`
- **URL**: `http://localhost:8080`
- **Configuration**: 
  - Environment variable: `PORT=8080` in `frontend/.env.local`
  - Package.json scripts: `--port 8080` flag added
  - Next.js config: Port specified in `next.config.ts`

### Backend (Express)
- **Port**: `5001`
- **URL**: `http://localhost:5001`
- **Configuration**: 
  - Environment variable: `PORT=5001` in `backend/.env`
  - Server.js: Uses `process.env.PORT || 5001`

## Configuration Files Updated

### 1. Frontend Configuration

#### `frontend/.env.local`
```env
# Frontend Configuration
PORT=8080

# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

#### `frontend/package.json`
```json
{
  "scripts": {
    "dev": "next dev --turbopack --port 8080",
    "start": "next start --port 8080"
  }
}
```

#### `frontend/next.config.ts`
```typescript
const nextConfig: NextConfig = {
  serverRuntimeConfig: {
    port: process.env.PORT || 8080,
  },
};
```

### 2. Backend Configuration

#### `backend/.env`
```env
PORT=5001
NODE_ENV=development
```

#### `backend/server.js`
- CORS configuration updated to only allow `http://localhost:8080`
- Removed support for other ports to prevent confusion
- Fixed port logging in startup message

### 3. Root Configuration

#### `package.json`
```json
{
  "scripts": {
    "dev": "npm run kill-ports && concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "kill-ports": "npx kill-port 8080 5001"
  }
}
```

## Development Workflow

### Starting the Application

1. **Kill any existing processes on the ports**:
   ```bash
   npm run kill-ports
   ```

2. **Start both services**:
   ```bash
   npm run dev
   ```

3. **Or start individually**:
   ```bash
   # Frontend only
   npm run dev:frontend
   
   # Backend only
   npm run dev:backend
   ```

### Accessing the Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5001/api
- **Backend Health Check**: http://localhost:5001/health

## Benefits of Fixed Port Configuration

1. **Consistency**: Same ports every time, no more guessing
2. **CORS Reliability**: Backend CORS is configured for specific frontend port
3. **Environment Stability**: No port conflicts between development sessions
4. **Documentation**: Clear port assignments for team members
5. **Automation**: Scripts can reliably target specific ports

## Troubleshooting

### Port Already in Use
If you get "port already in use" errors:

```bash
# Kill specific ports
npx kill-port 8080 5001

# Or use the npm script
npm run kill-ports
```

### CORS Issues
If you encounter CORS errors:
1. Ensure frontend is running on port 8080
2. Ensure backend is running on port 5001
3. Check that `NEXT_PUBLIC_API_URL` points to `http://localhost:5001/api`

### Environment Variables Not Loading
1. Restart both services after changing .env files
2. Ensure .env files are in the correct directories
3. Check that environment variables don't have extra spaces

## Production Considerations

In production:
- Frontend will use the port assigned by the hosting platform
- Backend will use the PORT environment variable from the hosting platform
- CORS configuration will switch to production domains
- Environment variables should be set in the hosting platform's configuration

## Port History

- **Before**: Ports were dynamic (3000, 3001 for frontend; 5000, 5001 for backend)
- **After**: Fixed ports (8080 for frontend, 5001 for backend)
- **Reason**: Eliminate port conflicts and ensure consistent development experience
