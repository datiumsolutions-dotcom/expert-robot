import { connectDB, disconnectDB } from '@loyalty/db/src/client';
import { logger } from '@loyalty/utils';

import { createApp } from './app';

const PORT = parseInt(process.env['API_PORT'] ?? '4000', 10);

async function bootstrap(): Promise<void> {
  try {
    // Connect to database
    await connectDB();
    logger.info('✅ Database connected');

    // Create and start Express app
    const app = createApp();

    const server = app.listen(PORT, () => {
      logger.info(`🚀 API server running on http://localhost:${PORT}`);
      logger.info(`📦 Environment: ${process.env['NODE_ENV'] ?? 'development'}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      server.close(async () => {
        await disconnectDB();
        logger.info('Database disconnected. Goodbye!');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
    process.on('SIGINT', () => { void shutdown('SIGINT'); });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

void bootstrap();
