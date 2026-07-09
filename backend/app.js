import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import requestLogger from './middlewares/requestLogger.js';
import apiRouter from './routes/index.js';
import { errorHandler, AppError } from './middlewares/errorHandler.js';

const app = express();

// 1. Security Headers
app.use(helmet());

// 2. CORS Configuration
const allowedOrigins = config.clientUrl.split(',').map(url => url.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      
      const isAllowed = allowedOrigins.includes(origin) || 
                        origin.endsWith('.vercel.app') || 
                        origin.startsWith('http://localhost:');
                        
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 3. Rate Limiting to prevent brute-force and DDoS attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Limit each IP to 10000 requests per windowMs (relaxed for testing)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    data: null,
    errors: ['Rate limit exceeded']
  }
});
app.use('/api', limiter);

// 4. Request Logging (Morgan + Winston)
app.use(requestLogger);

// 5. Payload Parsers (with size restrictions to protect against large payloads)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 6. Cookie Parser for secure HTTP-only cookies
app.use(cookieParser());

// 7. Gzip Compression for optimized asset/payload delivery
app.use(compression());

// 8. Static Assets / Uploads Folder setup
app.use('/uploads', express.static('uploads'));

// 9. API Routes mapping
app.use('/api/v1', apiRouter);

// 10. Fallback 404 Route Handler
app.use('*', (req, res, next) => {
  next(new AppError(`Can't find route ${req.originalUrl} on this server`, 404));
});

// 11. Global Error Handling Middleware
app.use(errorHandler);

export default app;
