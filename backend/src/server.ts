/**
 * @file  server.ts
 * @desc  Express application bootstrap for GIA Vehicle Booking API.
 *
 * Changes vs original:
 *   - httpLogger middleware added (logs every request with duration + status)
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Routes
import authRoutes       from './routes/auth.routes';
import vehicleRoutes    from './routes/vehicle.routes';
import bookingRoutes    from './routes/booking.routes';
import userRoutes       from './routes/user.routes';
import newsletterRoutes from './routes/newsletter.routes';
import paymentRoutes    from './routes/payment.routes';

// Middleware
import { errorHandler }  from './middleware/error.middleware';
import { httpLogger }    from './utils/logger.util';    // NEW: HTTP request logging
import { logger }        from './utils/logger.util';

dotenv.config();

const app: Application = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    let allowedOrigins: (string | undefined)[];

    if (process.env.NODE_ENV === 'development') {
      allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:8080',
        process.env.FRONTEND_URL,
        'https://gia-vehicle-booking.vercel.app',
        'https://gia-vehicle-booking-mocha.vercel.app',
        'https://gia-vehicle-booking-test.vercel.app',
      ].filter(Boolean);
    } else {
      allowedOrigins = [
        process.env.FRONTEND_URL,
        'https://gia-vehicle-booking.vercel.app',
        'https://gia-vehicle-booking-mocha.vercel.app',
        'https://gia-vehicle-booking-test.vercel.app',
      ].filter(Boolean);
    }

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS', `Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials:     true,
  methods:         ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders:  ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders:  ['Content-Range', 'X-Content-Range'],
  maxAge:          86400,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 min
  max:      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message:  'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── HTTP Request Logging ──────────────────────────────────────────────────────
app.use(httpLogger);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status:    'OK',
    message:   'GIA Vehicle Booking API is running',
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/vehicles',   vehicleRoutes);
app.use('/api/bookings',   bookingRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/payments',   paymentRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info('Server', `GIA Vehicle Booking API running on port ${PORT}`);
  logger.info('Server', `Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info('Server', `Health: http://localhost:${PORT}/health`);
});

export default app;