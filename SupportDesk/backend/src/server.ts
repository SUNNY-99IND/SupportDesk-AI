/**
 * Server entry point: bind the app to a port and handle shutdown.
 *
 * Graceful shutdown matters more than it looks. When a host sends SIGTERM
 * during a deploy, closing the server lets in-flight requests finish instead
 * of dropping them mid-response. Phase 2 will also close DB connections here.
 */
import { createApp } from './app';
import { env } from './config/env';
import { initPostgres } from './db/postgres';
import { initMongo } from './db/mongo';

async function bootstrap() {
  // Initialize databases (or fall back gracefully to resilient store)
  await initPostgres();
  await initMongo();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 SupportDesk AI API listening on http://localhost:${env.PORT}`);
    console.log(`  environment:  ${env.NODE_ENV}`);
    console.log(`  health check: http://localhost:${env.PORT}/api/health`);
  });

  function shutdown(signal: string): void {
    console.log(`\n${signal} received — shutting down.`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });

    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection]', reason);
    shutdown('unhandledRejection');
  });
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

