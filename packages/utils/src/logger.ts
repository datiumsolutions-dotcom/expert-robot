import winston from 'winston';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const isProduction = process.env['NODE_ENV'] === 'production';

export const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] ?? (isProduction ? 'info' : 'debug'),
  format: isProduction
    ? combine(timestamp(), errors({ stack: true }), json())
    : combine(colorize(), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), simple()),
  defaultMeta: { service: process.env['SERVICE_NAME'] ?? 'loyalty-api' },
  transports: [new winston.transports.Console()],
  exceptionHandlers: [new winston.transports.Console()],
  rejectionHandlers: [new winston.transports.Console()],
});
