/**
 * @module logger
 * @description アクセスログ・ターンログの記録ユーティリティ。
 */
import { NextRequest } from 'next/server';
import { mkdirSync } from 'node:fs';
import winston, { format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { extractClientIp } from './ip';

/** アクセスログ用フォーマッター（ip/hostはchildメタデータから取得）*/
const accessLogFormat = format.printf(({ level, message, timestamp, clientIp, host }) => {
  const logLevel = clientIp ? level : 'warn';
  return `${logLevel}:\t[${timestamp}]\t[${clientIp}]\t[${host}]\t${message}`;
});

/** ターンログ用フォーマッター */
const turnLogFormat = format.printf(({ level, message, timestamp }) => {
  return `${level}:\t[${timestamp}]\t${message}`;
});

/** ベースロガーをシングルトンとして生成する */
const createBaseLogger = (dir: string, logFormat: winston.Logform.Format) => {
  const logDirectory = `log/${dir}`;
  mkdirSync(logDirectory, { recursive: true });

  return winston.createLogger({
    level: 'silly',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SS',
      }),
      logFormat
    ),
    transports: [
      new winston.transports.Console(),
      new DailyRotateFile({
        filename: `${logDirectory}/%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '90d',
      }),
    ],
  });
};

/** アクセスログ用シングルトンロガー */
const _accessLogger = createBaseLogger('access', accessLogFormat);

/**
 * アクセスログ (log/access)
 * @param request Next.jsのリクエスト
 */
export const accessLogger = (request: NextRequest) => {
  const ip = extractClientIp(request);
  return _accessLogger.child({ clientIp: ip, host: request.nextUrl.host });
};

/**
 * ターン進行ログ (log/turn_proceed)
 */
export const turnProceedLogger = createBaseLogger('turn_proceed', turnLogFormat);
