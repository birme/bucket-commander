import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import * as path from 'path'
import credentialRoutes from './routes/credentials'
import s3Routes from './routes/s3'

// Environment variable validation
const requiredEnvVars = ['OSC_ACCESS_TOKEN']
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:')
  missingEnvVars.forEach(envVar => {
    console.error(`   - ${envVar}`)
  })
  console.error('\nPlease set these environment variables before starting the server.')
  console.error('Example: OSC_ACCESS_TOKEN=your_token_here npm start')
  process.exit(1)
}

const app = express()
const PORT = process.env.PORT || 3001

app.use(helmet())
app.use(cors())
app.use(morgan('combined'))
app.use(express.json())

// API Routes
app.use('/api/credentials', credentialRoutes)
app.use('/api/s3', s3Routes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Bucket Commander API is running' })
})

// Serve static files from frontend build
const frontendBuildPath = path.join(__dirname, '../../dist')
app.use(express.static(frontendBuildPath))

// Handle client-side routing - send all non-API requests to index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendBuildPath, 'index.html'))
  } else {
    res.status(404).json({ error: 'API endpoint not found' })
  }
})

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

app.listen(PORT, () => {
  console.log(`🪣 Bucket Commander running on port ${PORT}`)
  console.log(`📁 Frontend: http://localhost:${PORT}`)
  console.log(`🔌 API: http://localhost:${PORT}/api`)
  console.log(`🔑 OSC Access Token: ${process.env.OSC_ACCESS_TOKEN ? 'Configured ✅' : 'Missing ❌'}`)
})