/**
 * @module admin-api/logs
 * @description サーバーログ参照API。ローカルファイル、S3互換ストレージ、HTTP集約サーバーに対応。
 */
import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

type LogEntry = {
  path: string;
  type: 'file' | 'directory';
  size: number;
  updatedAt: string;
};

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

const MAX_LOG_PREVIEW_CHARS = 200000;

const transportModes = LOG_TRANSPORT_MODE.split(/[,;]+/)
  .map((mode) => mode.trim())
  .filter(Boolean);

const useFileTransport = transportModes.includes('file');
const useS3Transport = transportModes.includes('s3');

function isLogFilePath(relativePath: string): boolean {
  return path.extname(relativePath).toLowerCase() === '.log';
}

function normalizeToSafePath(relativePath: string): string | null {
  const normalized = relativePath.replace(/\\/g, '/');
  const logRoot = path.resolve(process.cwd(), LOG_BASE_DIR);
  const absolute = path.resolve(logRoot, normalized);
  if (absolute === logRoot || absolute.startsWith(`${logRoot}${path.sep}`)) {
    return absolute;
  }
  return null;
}

const s3Client = (() => {
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
})();

async function listLocalLogEntries(currentAbs: string, currentRel = ''): Promise<LogEntry[]> {
  const entries = await fs.readdir(currentAbs, { withFileTypes: true });
  const sorted = [...entries].sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name, 'ja');
  });

  const result: LogEntry[] = [];

  for (const entry of sorted) {
    const relPath = currentRel ? `${currentRel}/${entry.name}` : entry.name;
    const absPath = path.join(currentAbs, entry.name);

    if (entry.isDirectory()) {
      const children = await listLocalLogEntries(absPath, relPath);
      if (children.length === 0) {
        continue;
      }
      const stat = await fs.stat(absPath);
      result.push({
        path: relPath,
        type: 'directory',
        size: 0,
        updatedAt: stat.mtime.toISOString(),
      });
      result.push(...children);
    } else if (entry.isFile() && isLogFilePath(relPath)) {
      const stat = await fs.stat(absPath);
      result.push({
        path: relPath,
        type: 'file',
        size: stat.size,
        updatedAt: stat.mtime.toISOString(),
      });
    }
  }

  return result;
}

async function listS3LogEntries(prefix = ''): Promise<LogEntry[]> {
  if (!s3Client || !LOG_S3_BUCKET) return [];

  const result: LogEntry[] = [];
  let continuationToken: string | undefined;

  try {
    do {
      const response = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: LOG_S3_BUCKET,
          Prefix: prefix ? `${LOG_S3_KEY_PREFIX}/${prefix}` : LOG_S3_KEY_PREFIX,
          Delimiter: '/',
          ContinuationToken: continuationToken,
        })
      );

      const filesResult = parseS3Contents(response.Contents);
      result.push(...filesResult);

      const dirsResult = parseS3CommonPrefixes(response.CommonPrefixes);
      result.push(...dirsResult);

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);
  } catch (error) {
    console.error('[logs-api] S3 list error:', error);
  }

  return result;
}

function parseS3Contents(
  contents: Array<{ Key?: string; Size?: number; LastModified?: Date }> | undefined
): LogEntry[] {
  if (!contents) return [];
  return contents
    .filter((obj) => obj.Key && isLogFilePath(obj.Key))
    .map((obj) => ({
      path: obj.Key!.replace(`${LOG_S3_KEY_PREFIX}/`, ''),
      type: 'file' as const,
      size: obj.Size ?? 0,
      updatedAt: obj.LastModified?.toISOString() ?? new Date().toISOString(),
    }));
}

function parseS3CommonPrefixes(prefixes: Array<{ Prefix?: string }> | undefined): LogEntry[] {
  if (!prefixes) return [];
  return prefixes
    .filter((p) => p.Prefix)
    .map((p) => ({
      path: p.Prefix!.replace(`${LOG_S3_KEY_PREFIX}/`, '').replace(/\/$/, ''),
      type: 'directory' as const,
      size: 0,
      updatedAt: new Date().toISOString(),
    }));
}

async function listLogEntries(): Promise<LogEntry[]> {
  if (useFileTransport) {
    const logRoot = path.resolve(process.cwd(), LOG_BASE_DIR);
    try {
      await fs.access(logRoot);
      return await listLocalLogEntries(logRoot);
    } catch {
      return [];
    }
  }

  if (useS3Transport) {
    return await listS3LogEntries();
  }

  return [];
}

async function readLogFile(filePath: string): Promise<string | null> {
  if (useFileTransport) {
    const safeAbsPath = normalizeToSafePath(filePath);
    if (!safeAbsPath) return null;

    const targetStat = await fs.stat(safeAbsPath).catch(() => null);
    if (!targetStat || !targetStat.isFile()) return null;

    return await fs.readFile(safeAbsPath, 'utf-8');
  }

  if (useS3Transport && s3Client && LOG_S3_BUCKET) {
    try {
      const key = `${LOG_S3_KEY_PREFIX}/${filePath}`;
      const response = await s3Client.send(
        new GetObjectCommand({
          Bucket: LOG_S3_BUCKET,
          Key: key,
        })
      );

      if (!response.Body) return null;

      const chunks: Uint8Array[] = [];
      const reader = response.Body as AsyncIterable<Uint8Array>;

      for await (const chunk of reader) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks).toString('utf-8');
    } catch (error) {
      console.error('[logs-api] S3 read error:', error);
      return null;
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const adminUuid = request.headers.get('x-verified-admin-uuid');
  if (!adminUuid) {
    return NextResponse.json({ error: '認証に失敗しました。' }, { status: 401 });
  }

  const filePath = request.nextUrl.searchParams.get('file');

  const entries = await listLogEntries();

  if (!filePath) {
    return NextResponse.json({ entries, selectedFile: null, content: '' });
  }

  if (!isLogFilePath(filePath)) {
    return NextResponse.json({ error: '.log ファイルのみ表示できます。' }, { status: 400 });
  }

  const content = await readLogFile(filePath);
  if (!content) {
    return NextResponse.json({ error: 'ファイルが存在しません。' }, { status: 404 });
  }

  const isTruncated = content.length > MAX_LOG_PREVIEW_CHARS;
  const truncatedContent = isTruncated
    ? content.slice(content.length - MAX_LOG_PREVIEW_CHARS)
    : content;

  return NextResponse.json({
    entries,
    selectedFile: filePath,
    content: truncatedContent,
    isTruncated,
  });
}
