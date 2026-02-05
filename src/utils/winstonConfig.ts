import winston from 'winston';

const customErrorLevels = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    trace: 5,
  },
  colors: {
    fatal: 'magenta',
    error: 'red',
    warn: 'yellow',
    info: 'cyan',
    debug: 'green',
    trace: 'white',
  },
};

winston.addColors(customErrorLevels.colors);

const formatter = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${level}]: ${message}${metaString}`;
  }),
);

class Logger {
  private logger: winston.Logger;

  constructor() {
    const consoleTransport = new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize({ all: true }), formatter),
    });

    const fileTransport = new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    });

    this.logger = winston.createLogger({
      levels: customErrorLevels.levels,
      level: process.env.NODE_ENV === 'development' ? 'trace' : 'error',
      transports: process.env.NODE_ENV === 'development' ? [consoleTransport] : [fileTransport],
    });
  }

  trace(message: unknown, meta?: unknown) {
    this.logger.log('trace', formatMessage(message), meta);
  }

  debug(message: unknown, meta?: unknown) {
    this.logger.debug(formatMessage(message), meta);
  }

  info(message: unknown, meta?: unknown) {
    this.logger.info(formatMessage(message), meta);
  }

  warn(message: unknown, meta?: unknown) {
    this.logger.warn(formatMessage(message), meta);
  }

  error(message: unknown, meta?: unknown) {
    this.logger.error(formatMessage(message), meta);
  }

  fatal(message: unknown, meta?: unknown) {
    this.logger.log('fatal', formatMessage(message), meta);
  }
}

function formatMessage(message: unknown): string {
  if (message instanceof Error) {
    return message.message;
  }
  if (typeof message === 'string') {
    return message;
  }
  return JSON.stringify(message);
}

export const logger = new Logger();
