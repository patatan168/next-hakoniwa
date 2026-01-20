import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { validAuthCookie } from './global/function/auth';
import { dbConn } from './global/function/db';
import { extractClientIp } from './global/function/ip';

const authPaths = ['/api/auth/'];
const sessionPaths = ['/development'];

export async function proxy(request: NextRequest) {
  // 不正の疑いがあるIPアドレスは除外
  const ip = extractClientIp(request);
  if (!ip) return NextResponse.redirect(new URL(`/error/400`, request.url));

  const { pathname } = request.nextUrl;
  if (authPaths.some((prefix) => pathname.startsWith(prefix))) {
    return await authCheck(request);
  }
  if (sessionPaths.some((prefix) => pathname.startsWith(prefix))) {
    return await sessionCheck(request);
  }
  return NextResponse.next();
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
    return NextResponse.next();
  } else {
    return NextResponse.redirect(new URL(`/error/401`, request.url));
  }
}
