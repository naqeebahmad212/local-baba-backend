import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize } = format;

// Define log format
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

// Create a Winston logger
const logger = createLogger({
  level: 'info', // Set default log level
  format: combine(
    colorize(), // Colorize log output
    timestamp(), // Add timestamp to log
    logFormat // Apply custom log format
  ),
  transports: [
    new transports.Console(), // Log to console
    new transports.File({ filename: 'logs/app.log' }) // Log to file
  ],
});

export default logger;
