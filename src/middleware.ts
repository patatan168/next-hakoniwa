import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { sessionStore } from './global/store/api/auth/session';

export async function middleware(request: NextRequest) {
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

export const config = {
  matcher: ['/development/:path*'], // 認証が必要なルートを指定
};
