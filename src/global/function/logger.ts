/**
 * @module logger
 * @description アクセスログ・ターンログの記録ユーティリティ。
 */
import { NextRequest } from 'next/server';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import winston, { format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { extractClientIp } from './ip';

const LOG_BASE_DIR = process.env.LOG_BASE_DIR?.trim() || 'log';
const LOG_NETWORK_URL = process.env.LOG_NETWORK_URL?.trim();
const LOG_TRANSPORT_MODE = (process.env.LOG_TRANSPORT_MODE?.trim().toLowerCase() || 'both') as
  | 'file'
  | 'network'
  | 'both';

const resolveLogDirectory = (dir: string) => join(LOG_BASE_DIR, dir);
const useFileTransport = LOG_TRANSPORT_MODE === 'file' || LOG_TRANSPORT_MODE === 'both';
const useNetworkTransport = LOG_TRANSPORT_MODE === 'network' || LOG_TRANSPORT_MODE === 'both';

const createNetworkTransport = () => {
  if (!useNetworkTransport || !LOG_NETWORK_URL) return undefined;

  try {
    const parsed = new URL(LOG_NETWORK_URL);
    const isHttps = parsed.protocol === 'https:';

    if (!isHttps && parsed.protocol !== 'http:') {
      console.warn(`[logger] LOG_NETWORK_URL protocol is invalid: ${parsed.protocol}`);
      return undefined;
    }

    return new winston.transports.Http({
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : isHttps ? 443 : 80,
      path: `${parsed.pathname}${parsed.search}`,
      ssl: isHttps,
    });
  } catch {
    console.warn('[logger] LOG_NETWORK_URL is invalid. network transport is disabled.');
    return undefined;
  }
};

/** アクセスログ用フォーマッター（ip/hostはchildメタデータから取得）*/
const accessLogFormat = format.printf(({ level, message, timestamp, clientIp, host }) => {
  const logLevel = clientIp ? level : 'warn';
  return `${logLevel}:\t[${timestamp}]\t[${clientIp}]\t[${host}]\t${message}`;
});

/** ターンログ用フォーマッター */
const turnLogFormat = format.printf(({ level, message, timestamp }) => {
  return `${level}:\t[${timestamp}]\t${message}`;
});

/** ベースロガーを生成する */
const createBaseLogger = (dir: string, logFormat: winston.Logform.Format) => {
  const transports: winston.transport[] = [new winston.transports.Console()];

  if (useFileTransport) {
    const logDirectory = resolveLogDirectory(dir);
    mkdirSync(logDirectory, { recursive: true });
    transports.push(
      new DailyRotateFile({
        filename: `${logDirectory}/%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '90d',
      })
    );
  }

  const networkTransport = createNetworkTransport();
  if (networkTransport) {
    transports.push(networkTransport);
  }

  return winston.createLogger({
    level: 'silly',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SS',
      }),
      logFormat
    ),
    transports,
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
