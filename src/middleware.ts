import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const cookie = request.headers.get('cookie') ?? '';
  const res = await fetch(`${request.nextUrl.origin}/api/auth/session`, {
    headers: { cookie },
    method: 'GET',
  });

  if (res.ok) {
    return NextResponse.next();
  } else {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
}

export const config = {
  matcher: ['/development/:path*'], // 認証が必要なルートを指定
};
