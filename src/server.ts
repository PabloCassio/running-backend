import express, { Application, Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

// Database connection
import sequelize, { testConnection } from './config/database';

// Import models and associations
import './models/associations';

// Import routes
import authRoutes from './routes/auth.routes';
import raceRoutes from './routes/race.routes';
import userRoutes from './routes/user.routes';

// Import socket handlers
import initializeTrackingSocket from './sockets/tracking.socket';

// Import logger and middleware
import logger from './utils/logger';
import { requestLogger, errorLogger } from './middleware/logging.middleware';

// Load environment variables
dotenv.config();

const app: Application = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/races', raceRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'maratona-backend',
    database: 'connected',
    socketio: 'active'
  });
});

// API documentation
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Maratona Ao Vivo API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      races: '/api/races',
      users: '/api/users'
    },
    documentation: 'https://docs.maratonaaovivo.com'
  });
});

// Initialize socket.io tracking
initializeTrackingSocket(io);

// Error handling middleware
app.use(errorLogger);
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500,
      code: err.code || 'INTERNAL_ERROR'
    }
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404,
      code: 'ROUTE_NOT_FOUND'
    }
  });
});

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    server.listen(PORT, () => {
      logger.info('🚀 Server started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        socketio: 'active',
        database: 'connected',
      });
      logger.info(`Health check available at http://localhost:${PORT}/health`);
      logger.info(`API documentation at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server', { error });
    process.exit(1);
  }
};

// Only start server automatically if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, server, io, startServer };