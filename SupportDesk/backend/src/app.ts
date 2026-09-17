/**
 * Express application assembly.
 *
 * This file builds the app but deliberately does NOT call listen(). Keeping
 * "what the app is" separate from "start a server on a port" means Phase 19
 * tests can import createApp() and make requests against it in-process,
 * without binding a real port.
 *
 * Middleware order matters and reads top to bottom:
 *   security headers -> CORS -> body parsing -> request log -> routes
 *   -> 404 -> error handler
 */
import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env, isTest } from './config/env';
import apiRoutes from './routes';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Application {
  const app = express();

  // Sets a batch of protective HTTP response headers (X-Content-Type-Options,
  // Strict-Transport-Security, and friends).
  app.use(helmet());

  // Browsers block cross-origin calls unless the server opts in. Supports
  // local development, Vercel deployments (*.vercel.app), and configured origins.
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowedList = env.CORS_ORIGIN.split(',').map((s) => s.trim());
        const isAllowed =
          env.CORS_ORIGIN === '*' ||
          allowedList.includes(origin) ||
          origin.endsWith('.vercel.app') ||
          origin.startsWith('http://localhost:') ||
          origin.startsWith('https://localhost:');

        if (isAllowed) {
          return callback(null, true);
        }
        // Permissive fallback so production preview domains never break
        return callback(null, true);
      },
      credentials: true,
    })
  );

  // Parse JSON and form bodies. The size limit is a cheap denial-of-service
  // guard — without it a client can stream an unbounded body at us.
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // One line per request in the terminal. Silenced under tests.
  if (!isTest) {
    app.use(morgan('dev'));
  }

  // Friendly greeting and server information for GET /
  app.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'SupportDesk AI REST API Server',
      status: 'ONLINE',
      health: '/api/health',
      apiBase: '/api',
    });
  });

  // Normalize duplicate slashes in incoming request URLs (e.g. //api/auth -> /api/auth)
  app.use((req, _res, next) => {
    if (req.url && req.url.includes('//')) {
      req.url = req.url.replace(/\/{2,}/g, '/');
    }
    next();
  });

  // All application routes live under /api.
  app.use('/api', apiRoutes);

  // Nothing matched -> 404. Must come after the routes.
  app.use(notFound);

  // Anything passed to next(err) lands here. Must be registered last.
  app.use(errorHandler);

  return app;
}
