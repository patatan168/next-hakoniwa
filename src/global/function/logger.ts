/**
 * @module logger
 * @description アクセスログ・ターンログの記録ユーティリティ。
 */
import { NextRequest } from 'next/server';
import { mkdirSync } from 'node:fs';
import winston, { format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { extractClientIp } from './ip';

/** ログフォーマッターを生成する */
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

/** Winstonロガーインスタンスを生成する */
const logger = (dir: string, request?: NextRequest) => {
  const logDirectory = `log/${dir}`;
  mkdirSync(logDirectory, { recursive: true });

  const transports = [
    new winston.transports.Console(),
    new DailyRotateFile({
      filename: `${logDirectory}/%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '90d',
    }),
  ];

  return winston.createLogger({
    level: 'silly',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SS',
      }),
      logFormat(request)
    ),
    transports,
  });
};

/**
 * アクセスログ (log/access)
 * @param request Next.jsのリクエスト
 */
export const accessLogger = (request: NextRequest) => logger('access', request);

/**
 * ターン進行ログ (log/turn_proceed)
 * @param request Next.jsのリクエスト
 */
export const turnProceedLogger = logger('turn_proceed');
