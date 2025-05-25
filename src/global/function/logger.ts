import 'server-only';

import { NextRequest } from 'next/server';
import winston, { format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { getIpAddress } from './ip';

const logFormat = (request?: NextRequest) =>
  format.printf(({ level, message, timestamp }) => {
    if (request !== undefined) {
      const ip = getIpAddress(request);
      return `${level}: [${timestamp}] [${ip}] [${request.nextUrl.host}] ${message}`;
    } else {
      return `${level}: [${timestamp}] ${message}`;
    }
  });

const logger = (dir: string, request?: NextRequest) => {
  return winston.createLogger({
    level: 'silly',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SS',
      }),
      logFormat(request)
    ),
    transports: [
      new winston.transports.Console(),
      new DailyRotateFile({
        filename: `log/${dir}/%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '90d',
      }),
    ],
  });
};

/**
 * アクセスログ (log/access)
 * @param request Next.jsのリクエスト
 */
export const accessLogger = (request: NextRequest) => logger('access', request);
