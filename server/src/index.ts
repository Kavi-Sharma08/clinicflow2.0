import express from 'express';
import http from 'http';
import { connectDB } from './db/db.js';
import routes from './routes/index.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initRealtimeServer } from './services/realtime.service.js';
import { env, isOriginAllowed } from './config/env.js';

const app = express();
const server = http.createServer(app);

// Enable trust proxy for secure cookies and reverse proxies (e.g. Render, Vercel)
app.set('trust proxy', 1);

// Configure CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server, mobile apps)
      if (!origin) return callback(null, true);
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 200,
  })
);

app.use(cookieParser());
app.use(express.json());

// Health check endpoint for deployment monitoring
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', routes);

const startServer = async () => {
  await connectDB();

  initRealtimeServer(server);

  server.listen(env.PORT, () => {
    console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });
};

startServer();