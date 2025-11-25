import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { MongoClient, Db } from 'mongodb'
import { config } from 'dotenv'
import { createMainPageRouter } from './routes/mainpage'
import { createUserRouter } from './routes/user'
import { createAdminRouter } from './routes/admin'

// Load environment variables
config()

const app: Application = express()
const PORT = process.env.API_PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// MongoDB connection
let db: Db

async function connectToDatabase(): Promise<Db> {
  const mongoUrl = process.env.MONGO_URL
  if (!mongoUrl) {
    throw new Error('MONGO_URL environment variable is not set')
  }

  const client = new MongoClient(mongoUrl, {
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  })
  await client.connect()
  console.log('Connected to MongoDB')

  // Extract database name from URL or use default
  const dbName = process.env.MONGO_DB_NAME || 'fractionalizeDB'
  return client.db(dbName)
}

// Initialize server
async function startServer() {
  try {
    // Connect to database
    db = await connectToDatabase()

    // Root endpoint
    app.get('/', (req: Request, res: Response) => {
      res.json({
        status: 'success',
        message: 'Fractionalize BSV Overlay API',
        version: '1.0.0',
        endpoints: {
          mainpage: '/api/mainpage',
          user: '/api/user',
          admin: '/api/admin/stats',
          health: '/api/admin/health'
        }
      })
    })

    // Mount routes
    app.use('/api/mainpage', createMainPageRouter(db))
    app.use('/api/user', createUserRouter(db))
    app.use('/api/admin', createAdminRouter(db))

    // 404 handler
    app.use((req: Request, res: Response) => {
      res.status(404).json({
        status: 'error',
        message: 'Endpoint not found',
        code: 'NOT_FOUND'
      })
    })

    // Error handler
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Unhandled error:', err)
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR'
      })
    })

    // Start listening
    app.listen(PORT, () => {
      console.log(`Fractionalize API server running on port ${PORT}`)
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`Network: ${process.env.NETWORK || 'main'}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...')
  process.exit(0)
})

// Start the server
startServer()
