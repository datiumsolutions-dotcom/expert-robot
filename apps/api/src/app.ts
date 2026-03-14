import compression from 'compression';
import cors from 'cors';
import type { Express } from 'express';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { router } from './routes';

export function createApp(): Express {
  const app = express();

  // ─── Security middleware ──────────────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: process.env['CORS_ORIGIN']?.split(',') ?? ['http://localhost:3000'],
      credentials: true,
    }),
  );

  // ─── Rate limiting ────────────────────────────────────────────────────────
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // ─── Body parsing & compression ──────────────────────────────────────────
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ─── Request logging ─────────────────────────────────────────────────────
  app.use(requestLogger);

  // ─── Health check (no auth required) ─────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ─── API routes ───────────────────────────────────────────────────────────
  app.use('/api/v1', router);

  // ─── Error handling (must be last) ───────────────────────────────────────
  app.use(errorHandler);

  return app;
}
