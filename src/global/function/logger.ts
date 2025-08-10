import 'server-only';

import { NextRequest } from 'next/server';
import winston, { format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { extractClientIp } from './ip';

const logFormat = (request?: NextRequest) =>
  format.printf(({ level, message, timestamp }) => {
    if (request !== undefined) {
      const ip = extractClientIp(request);
      const logLevel = ip ? level : 'warn';
      return `${logLevel}:\t[${timestamp}]\t[${ip}]\t[${request.nextUrl.host}]\t${message}`;
    } else {
      return `${level}:\t[${timestamp}]\t${message}`;
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
