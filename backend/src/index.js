import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

// Import routes
import peopleRoutes from './routes/people.js';
import tasksRoutes from './routes/tasks.js';
import categoriesRoutes from './routes/categories.js';
import uploadRoutes from './routes/upload.js';
import commentsRoutes, { setSocketIO } from './routes/comments.js';

// Import database
import { initDatabase } from './db/database.js';

// Import middleware
import { apiLimiter, uploadLimiter, createLimiter } from './middleware/rateLimiter.js';
import { sendErrorResponse } from './utils/errorHandler.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy headers when behind a reverse proxy
app.set('trust proxy', true);

const httpServer = createServer(app);

// CORS configuration for multiple origins
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');
const socketCorsOrigins = (process.env.SOCKET_CORS_ORIGIN || 'http://localhost:5173').split(',');

// Helper function to validate origin against allowed patterns
function isOriginAllowed(origin, allowedOrigins) {
  if (!origin) return true; // Allow requests with no origin

  return allowedOrigins.some(allowed => {
    // Exact match
    if (allowed === origin) return true;
    
    // Special handling for local network IPs (192.168.x.x)
    if (allowed.includes('192.168.*')) {
      const protocol = allowed.split('://')[0];
      const port = allowed.split(':').pop();
      const expectedUrl = `${protocol}://192.168.*:${port}`;
      
      if (allowed === expectedUrl) {
        // Validate it's actually a 192.168.x.x IP
        const urlPattern = new RegExp(`^${protocol}://192\\.168\\.[0-9]{1,3}\\.[0-9]{1,3}:${port}$`);
        return urlPattern.test(origin);
      }
    }
    
    // Special handling for Tailscale network (100.64.0.0/10)
    if (allowed.includes('100.64.*')) {
      const protocol = allowed.split('://')[0];
      const port = allowed.split(':').pop();
      const expectedUrl = `${protocol}://100.64.*:${port}`;
      
      if (allowed === expectedUrl) {
        // Validate it's actually a 100.64.x.x IP (Tailscale range)
        const urlPattern = new RegExp(`^${protocol}://100\\.64\\.[0-9]{1,3}\\.[0-9]{1,3}:${port}$`);
        return urlPattern.test(origin);
      }
    }
    
    return false;
  });
}

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin, socketCorsOrigins)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST']
  }
});

// Pass socket.io instance to comments route
setSocketIO(io);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Development: Allow unsafe-eval for Vite HMR, unsafe-inline for dev tools
      // Production: Stricter CSP without unsafe-eval/unsafe-inline
      scriptSrc: process.env.NODE_ENV === 'development' 
        ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"] 
        : ["'self'", "'unsafe-inline'"], // Allow inline scripts in production temporarily
      styleSrc: ["'self'", "'unsafe-inline'"], // Vue scoped styles need this
      imgSrc: ["'self'", "data:", "blob:", "https:"], // Allow HTTPS images
      connectSrc: process.env.NODE_ENV === 'development'
        ? ["'self'", "ws:", "wss:", "http://localhost:*", "https://localhost:*"]
        : ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "blob:"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  // Additional security headers
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true
}));
app.use(cors({
  origin: (origin, callback) => {
    console.log('CORS check - Origin:', origin, 'Allowed:', corsOrigins);
    if (isOriginAllowed(origin, corsOrigins)) {
      callback(null, true);
    } else {
      console.error('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'public')));
}

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// API Routes with specific rate limits
app.use('/api/people', peopleRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes);
app.use('/api/comments', apiLimiter, commentsRoutes);

// Apply create limiter to POST endpoints
app.post('/api/people', createLimiter);
app.post('/api/tasks', createLimiter);
app.post('/api/categories', createLimiter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const { checkDatabaseHealth, getDatabaseStats } = await import('./db/database.js');
    
    // Check database health
    const dbHealth = await checkDatabaseHealth();
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: dbHealth
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      error: error.message
    });
  }
});

// Database stats endpoint (development only)
app.get('/api/health/db', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Database stats only available in development' });
  }
  
  try {
    const { getDatabaseStats } = await import('./db/database.js');
    const stats = await getDatabaseStats();
    res.json(stats);
  } catch (error) {
    console.error('Database stats failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Join room for real-time updates
  socket.on('join-family', () => {
    socket.join('family-room');
    console.log('Client joined family room:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
  sendErrorResponse(res, err);
});

// Serve index.html for all non-API routes in production (SPA)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });
} else {
  // 404 handler for development
  app.use((req, res) => {
    res.status(404).json({ error: { message: 'Route not found' } });
  });
}

// Initialize server
async function startServer() {
  try {
    // Ensure required directories exist
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const dataDir = path.join(__dirname, '..', 'data');
    
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(dataDir, { recursive: true });
    
    // Initialize database
    await initDatabase();
    
    const PORT = process.env.PORT || 4000;
    const HOST = '0.0.0.0';
    httpServer.listen(PORT, HOST, () => {
      console.log(`🚀 FamilyToDo backend running on ${HOST}:${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📲 Network access: http://192.168.7.244:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { io };