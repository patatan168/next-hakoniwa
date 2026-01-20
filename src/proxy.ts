import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { validAuthCookie } from './global/function/auth';
import { dbConn } from './global/function/db';
import { extractClientIp } from './global/function/ip';

const WINDOW_MS = 1 * 1000;
const MAX_REQUESTS = 10;
const STRICT_MAX_REQUESTS = 3;
const ipMap = new Map<string, { count: number; timestamp: number }>();

const rateLimitPaths = ['/api/public'];
const strictRateLimitPaths = ['/api/sign-in', '/api/sign-up'];
const authPaths = ['/api/auth/'];
const sessionPaths = ['/development'];

export async function proxy(request: NextRequest) {
  // 不正の疑いがあるIPアドレスは除外
  const ip = extractClientIp(request);
  if (!ip) return new Response('', { status: 400 });

  const { pathname } = request.nextUrl;
  if (strictRateLimitPaths.some((prefix) => pathname.startsWith(prefix))) {
    return await rateLimit(request, STRICT_MAX_REQUESTS);
  }
  if (rateLimitPaths.some((prefix) => pathname.startsWith(prefix))) {
    return await rateLimit(request, MAX_REQUESTS);
  }
  if (authPaths.some((prefix) => pathname.startsWith(prefix))) {
    return await authCheck(request);
  }
  if (sessionPaths.some((prefix) => pathname.startsWith(prefix))) {
    return await sessionCheck(request);
  }
  return NextResponse.next();
}

async function rateLimit(request: NextRequest, maxRequests: number) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';

  const now = Date.now();
  const entry = ipMap.get(ip);
  const isResetMap = !entry || now - entry.timestamp > WINDOW_MS;
  let isLimit = true;

  if (isResetMap) {
    ipMap.set(ip, { count: 1, timestamp: now });
  } else {
    if (entry.count >= maxRequests) {
      isLimit = false;
    } else {
      entry.count += 1;
    }
  }

  if (!isLimit) {
    return new NextResponse('Too many requests', { status: 429 });
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
