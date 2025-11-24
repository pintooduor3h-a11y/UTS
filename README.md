# Fractionalize RWAs BSV Overlay API

A REST API server for the UTS BSV Overlay service, providing three main endpoints for React frontend integration.

## Overview

This API provides access to the UTS overlay service data stored in MongoDB. It exposes three main endpoints:

1. **Main Page** - Dashboard data with statistics and recent records
2. **User** - Query interface for searching and filtering records
3. **Admin** - Administrative statistics and health monitoring (requires authentication)

## Features

- RESTful API endpoints for overlay data access
- MongoDB integration for data persistence
- CORS support for React frontend
- Admin authentication with bearer tokens
- Comprehensive error handling
- TypeScript support
- Request logging

## Installation

```bash
cd fractionalize-app
npm install
```

## Configuration

Create a `.env` file in the `fractionalize-app` directory (copy from `.env.example`):

```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
MONGO_DB_NAME=fractionalizeDB
API_PORT=3000
NODE_ENV=development
NETWORK=main
ADMIN_TOKEN=your_secret_admin_token_here
```

## Development

Run the development server with hot-reload:

```bash
npm run dev
```

## Production

Build and run the production server:

```bash
npm run build
npm start
```

## API Endpoints

### 1. Main Page Endpoint

**GET** `/api/mainpage`

Returns main dashboard data including total records, recent records, and time-based statistics.

**Response:**
```json
{
  "status": "success",
  "data": {
    "totalRecords": 1234,
    "recentRecords": [
      {
        "txid": "abc123...",
        "outputIndex": 0
      }
    ],
    "statistics": {
      "last24h": 45,
      "last7d": 312,
      "last30d": 987
    }
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/mainpage
```

### 2. User Query Endpoint

**GET** `/api/user`

Query fractionalize records with optional filters and pagination.

**Query Parameters:**
- `txid` (optional) - Filter by exact transaction ID
- `limit` (optional) - Maximum results (default: 50, max: 100)
- `skip` (optional) - Skip results for pagination (default: 0)
- `startDate` (optional) - Filter records after this date (ISO 8601)
- `endDate` (optional) - Filter records before this date (ISO 8601)
- `sortOrder` (optional) - Sort order: `asc` or `desc` (default: `desc`)

**Response:**
```json
{
  "status": "success",
  "data": {
    "records": [
      {
        "txid": "abc123...",
        "outputIndex": 0
      }
    ],
    "count": 25,
    "query": {
      "limit": 50,
      "skip": 0,
      "sortOrder": "desc"
    }
  }
}
```

**Examples:**

Get all records (paginated):
```bash
curl http://localhost:3000/api/user?limit=20&skip=0
```

Query by transaction ID:
```bash
curl http://localhost:3000/api/user?txid=abc123def456...
```

Query by date range:
```bash
curl "http://localhost:3000/api/user?startDate=2025-01-01&endDate=2025-01-31&sortOrder=asc"
```

### 3. Admin Endpoints

All admin endpoints require authentication via bearer token in the `Authorization` header.

#### Admin Statistics

**GET** `/api/admin/stats`

Returns comprehensive administrative statistics.

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "totalRecords": 1234,
    "databaseStats": {
      "collections": 5,
      "indexes": 8,
      "storageSize": 1048576
    },
    "recentActivity": {
      "last1h": 12,
      "last24h": 45,
      "last7d": 312,
      "last30d": 987
    }
  }
}
```

**Example:**
```bash
curl -H "Authorization: Bearer your_token" \
  http://localhost:3000/api/admin/stats
```

#### Health Check

**GET** `/api/admin/health`

Check database connectivity and API health.

**Headers:**
```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "database": "connected",
    "timestamp": "2025-01-22T12:34:56.789Z"
  }
}
```

**Example:**
```bash
curl -H "Authorization: Bearer your_token" \
  http://localhost:3000/api/admin/health
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "status": "error",
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

**Common Error Codes:**
- `INVALID_PARAMETERS` - Invalid query parameters
- `INVALID_DATE` - Invalid date format
- `INVALID_SORT_ORDER` - Invalid sort order value
- `UNAUTHORIZED` - Invalid or missing admin token
- `NOT_FOUND` - Endpoint not found (404)
- `INTERNAL_SERVER_ERROR` - Server error (500)
- `DATABASE_UNAVAILABLE` - Database connection failed (503)

## Integration with React Frontend

### Example: Fetch Main Page Data

```javascript
async function fetchMainPageData() {
  try {
    const response = await fetch('http://localhost:3000/api/mainpage')
    const data = await response.json()

    if (data.status === 'success') {
      console.log('Total records:', data.data.totalRecords)
      console.log('Recent records:', data.data.recentRecords)
    }
  } catch (error) {
    console.error('Error fetching main page data:', error)
  }
}
```

### Example: Query User Records

```javascript
async function queryRecords(filters) {
  const params = new URLSearchParams(filters)

  try {
    const response = await fetch(`http://localhost:3000/api/user?${params}`)
    const data = await response.json()

    if (data.status === 'success') {
      console.log('Records:', data.data.records)
      console.log('Count:', data.data.count)
    }
  } catch (error) {
    console.error('Error querying records:', error)
  }
}

// Usage
queryRecords({
  limit: 20,
  skip: 0,
  sortOrder: 'desc'
})
```

### Example: Fetch Admin Stats

```javascript
async function fetchAdminStats(adminToken) {
  try {
    const response = await fetch('http://localhost:3000/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    })
    const data = await response.json()

    if (data.status === 'success') {
      console.log('Database stats:', data.data.databaseStats)
      console.log('Recent activity:', data.data.recentActivity)
    }
  } catch (error) {
    console.error('Error fetching admin stats:', error)
  }
}
```

## Project Structure

```
fractionalize-app/
├── src/
│   ├── index.ts              # Main server file
│   ├── types/
│   │   └── api.ts            # TypeScript type definitions
│   └── routes/
│       ├── mainpage.ts       # Main page endpoint
│       ├── user.ts           # User query endpoint
│       └── admin.ts          # Admin endpoints
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Technology Stack

- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **MongoDB** - Database (shared with overlay service)
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment configuration

## Running with Docker (Optional)

You can create a `Dockerfile` for containerized deployment:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t fractionalize-api .
docker run -p 3000:3000 --env-file .env fractionalize-api
```

## Security Considerations

1. **Admin Token**: Keep your `ADMIN_TOKEN` secret and use a strong random value
2. **CORS**: Configure CORS origins appropriately for production
3. **Rate Limiting**: Consider adding rate limiting middleware for production
4. **HTTPS**: Use HTTPS in production environments
5. **Environment Variables**: Never commit `.env` files to version control

## Logging

The API logs all incoming requests with timestamps:

```
[2025-01-22T12:34:56.789Z] GET /api/mainpage
[2025-01-22T12:35:01.234Z] GET /api/user
```

## License

Open BSV License

## Support


