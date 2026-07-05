import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import { connectDB } from './db/db.js';
import routes from './routes/index.js';
import cors from "cors";
import cookieParser from 'cookie-parser' 
import { initRealtimeServer } from './services/realtime.service.js'

dotenv.config()

const app = express()
const server = http.createServer(app)
const port = process.env.PORT

app.use(cors({
  origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
  credentials: true,                      
}))

app.use(cookieParser()) 
app.use(express.json())
app.use('/api', routes) 


const startServer = async () => {
  await connectDB()

  initRealtimeServer(server)

  server.listen(port , () => {
    console.log('Server running on port ' + port)
  })
}

startServer()