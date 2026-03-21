/**
 * @module admin-api/logs
 * @description サーバーログ参照API。
 */
import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

type LogEntry = {
  path: string;
  type: 'file' | 'directory';
  size: number;
  updatedAt: string;
};

const LOG_ROOT = path.resolve(process.cwd(), 'log');
const MAX_LOG_PREVIEW_CHARS = 200000;

function isLogFilePath(relativePath: string): boolean {
  return path.extname(relativePath).toLowerCase() === '.log';
}

function normalizeToSafePath(relativePath: string): string | null {
  const normalized = relativePath.replace(/\\/g, '/');
  const absolute = path.resolve(LOG_ROOT, normalized);
  if (absolute === LOG_ROOT || absolute.startsWith(`${LOG_ROOT}${path.sep}`)) {
    return absolute;
  }
  return null;
}

async function listLogEntries(currentAbs: string, currentRel = ''): Promise<LogEntry[]> {
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
      const children = await listLogEntries(absPath, relPath);
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

export async function GET(request: NextRequest) {
  const adminUuid = request.headers.get('x-verified-admin-uuid');
  if (!adminUuid) {
    return NextResponse.json({ error: '認証に失敗しました。' }, { status: 401 });
  }

  const filePath = request.nextUrl.searchParams.get('file');

  try {
    await fs.access(LOG_ROOT);
  } catch {
    return NextResponse.json({ entries: [], content: '', selectedFile: null });
  }

  const entries = await listLogEntries(LOG_ROOT);

  if (!filePath) {
    return NextResponse.json({ entries, selectedFile: null, content: '' });
  }

  const safeAbsPath = normalizeToSafePath(filePath);
  if (!safeAbsPath) {
    return NextResponse.json({ error: '不正なパスです。' }, { status: 400 });
  }

  if (!isLogFilePath(filePath)) {
    return NextResponse.json({ error: '.log ファイルのみ表示できます。' }, { status: 400 });
  }

  const targetStat = await fs.stat(safeAbsPath).catch(() => null);
  if (!targetStat || !targetStat.isFile()) {
    return NextResponse.json({ error: 'ファイルが存在しません。' }, { status: 404 });
  }

  const rawContent = await fs.readFile(safeAbsPath, 'utf-8');
  const isTruncated = rawContent.length > MAX_LOG_PREVIEW_CHARS;
  const content = isTruncated
    ? rawContent.slice(rawContent.length - MAX_LOG_PREVIEW_CHARS)
    : rawContent;

  return NextResponse.json({
    entries,
    selectedFile: filePath,
    content,
    isTruncated,
  });
}
