import { LoggingWinston } from '@google-cloud/logging-winston';
import winston from 'winston';

const Logger = winston.createLogger({
  level: 'info',
  transports: [new LoggingWinston()]
});

export default Logger;
