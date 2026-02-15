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
app.use(cors({
  origin: true,  // Accepte TOUTES les origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.options('*', cors());


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