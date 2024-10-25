import { LoggingWinston } from '@google-cloud/logging-winston';
import { createLogger } from 'winston';

export const Logger = createLogger({
  level: 'info',
  transports: [new LoggingWinston()]
});
