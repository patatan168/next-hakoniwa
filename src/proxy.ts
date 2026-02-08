import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { validAuthCookie } from './global/function/auth';
import { dbConn } from './global/function/db';

const authPaths = ['/api/auth/'];
const sessionPaths = ['/development'];
const excludeNoncePaths = ['/api'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (authPaths.some((prefix) => pathname.startsWith(prefix))) {
    return await authCheck(request);
  }
  if (sessionPaths.some((prefix) => pathname.startsWith(prefix))) {
    return await sessionCheck(request);
  }
  if (excludeNoncePaths.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next({});
  }

  return crateNonceResponse(request);
}

function getCspHeader(nonce: string) {
  const baseHeader =
    "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests;";
  const scriptStr =
    process.env.NODE_ENV === 'development'
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; "
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic';`;
  return `${baseHeader} ${scriptStr}`;
}

function crateNonceResponse(request: NextRequest) {
  // nonceを生成（base64）
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  // CSPヘッダーを構築
  const cspHeader = getCspHeader(nonce);

  const requestHeaders = new Headers(request.headers);
  // コンポーネントから読み取れるようにリクエストヘッダーにセット
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // レスポンスヘッダーにもCSPをセット
  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

async function authCheck(request: NextRequest) {
  using db = dbConn('./src/db/data/main.db');
  const uuid = await validAuthCookie(db.client, true);

  if (uuid) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-verified-uuid', uuid);
    return NextResponse.next({ headers: requestHeaders });
  } else {
    return NextResponse.redirect(new URL(`/error/401`, request.url));
  }
}

async function sessionCheck(request: NextRequest) {
  using db = dbConn('./src/db/data/main.db');
  const uuid = await validAuthCookie(db.client, true);

  if (uuid) {
    return crateNonceResponse(request);
  } else {
    return NextResponse.redirect(new URL(`/error/401`, request.url));
  }
}
