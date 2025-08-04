import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { sessionStore } from './global/store/api/auth/session';

const WINDOW_MS = 1 * 1000;
const MAX_REQUESTS = 10;
const ipMap = new Map<string, { count: number; timestamp: number }>();

const rateLimitPaths = ['/api'];
const sessionPaths = ['/development'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (rateLimitPaths.some((prefix) => pathname.startsWith(prefix))) {
    return await rateLimit(request);
  }
  if (sessionPaths.some((prefix) => pathname.startsWith(prefix))) {
    return await sessionCheck(request);
  }
  return NextResponse.next();
}

async function rateLimit(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';

  const now = Date.now();
  const entry = ipMap.get(ip);
  const isResetMap = !entry || now - entry.timestamp > WINDOW_MS;
  let isLimit = true;

  if (isResetMap) {
    ipMap.set(ip, { count: 1, timestamp: now });
  } else {
    if (entry.count >= MAX_REQUESTS) {
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

async function sessionCheck(request: NextRequest) {
  const cookie = request.headers.get('cookie') ?? '';
  await sessionStore
    .getState()
    .fetch({ headers: { cookie }, method: 'GET' }, { urlOrigin: request.nextUrl.origin });

  if (!sessionStore.getState().error.get) {
    return NextResponse.next();
  } else {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
}
