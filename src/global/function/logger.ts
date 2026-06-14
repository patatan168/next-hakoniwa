/**
 * @module logger
 * @description アクセスログ・ターンログの記録ユーティリティ。
 */
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { NextRequest } from 'next/server';
import crypto from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import winston, { format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import TransportStream from 'winston-transport';
import { extractClientIp } from './ip';

const LOG_BASE_DIR = process.env.LOG_BASE_DIR?.trim() || 'log';
const LOG_TRANSPORT_MODE = (process.env.LOG_TRANSPORT_MODE?.trim().toLowerCase() || 'file,s3') as
  | 'file'
  | 's3';
const LOG_S3_BUCKET = process.env.LOG_S3_BUCKET?.trim();
const LOG_S3_REGION = process.env.LOG_S3_REGION?.trim() || 'us-east-1';
const LOG_S3_ENDPOINT = process.env.LOG_S3_ENDPOINT?.trim();
const LOG_S3_ACCESS_KEY_ID = process.env.LOG_S3_ACCESS_KEY_ID?.trim();
const LOG_S3_SECRET_ACCESS_KEY = process.env.LOG_S3_SECRET_ACCESS_KEY?.trim();
const LOG_S3_KEY_PREFIX = process.env.LOG_S3_KEY_PREFIX?.trim() || 'logs';
const LOG_S3_FORCE_PATH_STYLE = process.env.LOG_S3_FORCE_PATH_STYLE === 'true';

const resolveLogDirectory = (dir: string) => join(LOG_BASE_DIR, dir);
const transportModes = LOG_TRANSPORT_MODE.split(/[,;]+/)
  .map((mode) => mode.trim())
  .filter(Boolean);

const useFileTransport = transportModes.includes('file');
const useS3Transport = transportModes.includes('s3');

const createS3Client = () => {
  if (!useS3Transport || !LOG_S3_BUCKET) return undefined;

  const config: Record<string, unknown> = {
    region: LOG_S3_REGION,
  };

  if (LOG_S3_ACCESS_KEY_ID && LOG_S3_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: LOG_S3_ACCESS_KEY_ID,
      secretAccessKey: LOG_S3_SECRET_ACCESS_KEY,
    };
  }

  if (LOG_S3_ENDPOINT) {
    config.endpoint = LOG_S3_ENDPOINT;
  }

  if (LOG_S3_FORCE_PATH_STYLE) {
    config.forcePathStyle = true;
  }

  return new S3Client(config);
};

class S3Transport extends TransportStream {
  private client = createS3Client();
  private readonly dir: string;
  private readonly prefix: string;

  constructor(dir: string, options?: winston.transport.TransportStreamOptions) {
    super(options);
    this.dir = dir;
    this.prefix = LOG_S3_KEY_PREFIX.replace(/\/*$/, '');
  }

  async log(info: winston.Logform.TransformableInfo, callback: () => void) {
    setImmediate(() => this.emit('logged', info));

    if (!this.client) {
      callback();
      return;
    }

    try {
      const message = (info[Symbol.for('message')] as string) ?? info.message;
      const now = new Date();
      const date = now.toISOString().slice(0, 10);
      const timestamp = now.toISOString().replace(/[:.]/g, '-');
      const key = `${this.prefix}/${this.dir}/${date}/${timestamp}-${crypto.randomUUID()}.log`;

      await this.client.send(
        new PutObjectCommand({
          Bucket: LOG_S3_BUCKET,
          Key: key,
          Body: `${message}\n`,
          ContentType: 'text/plain',
        })
      );
    } catch (error) {
      this.emit('error', error);
    } finally {
      callback();
    }
  }
}

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

  if (useS3Transport) {
    transports.push(new S3Transport(dir));
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
