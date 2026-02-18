import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { validAuthCookie } from './global/function/auth';
import { CSRF_COOKIE_NAME, generateCsrfToken, verifyCsrfToken } from './global/function/csrf';
import { dbConn } from './global/function/db';

const authPaths = ['/api/auth/'];
const sessionPaths = ['/development'];
const excludeNoncePaths = ['/api'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const csrfResult = await csrfCheck(request);
  if (csrfResult.error) return csrfResult.error;

  let response: NextResponse;
  if (authPaths.some((prefix) => pathname.startsWith(prefix))) {
    response = await authCheck(request);
  } else if (sessionPaths.some((prefix) => pathname.startsWith(prefix))) {
    response = await sessionCheck(request);
  } else if (excludeNoncePaths.some((prefix) => pathname.startsWith(prefix))) {
    response = NextResponse.next({});
  } else {
    response = crateNonceResponse(request);
  }

  if (csrfResult.shouldSetCookie && csrfResult.token) {
    response.cookies.set(CSRF_COOKIE_NAME, csrfResult.token, {
      httpOnly: false,
      maxAge: 600,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
  }

  return response;
}

/**
 * CSRFチェック
 * @param request リクエスト
 * @returns チェック結果
 */
async function csrfCheck(
  request: NextRequest
): Promise<{ error?: NextResponse; token?: string; shouldSetCookie: boolean }> {
  // Cookieからトークンを取得
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  // ヘッダーからトークンを取得
  const headerToken = request.headers.get('x-csrf-token');
  const method = request.method.toUpperCase();
  // 安全なメソッドかどうか
  const isSafe = ['GET', 'HEAD', 'OPTIONS'].includes(method);

  // 安全でないメソッドの場合はトークンを検証
  if (!isSafe) {
    const isValid = verifyCsrfToken(cookieToken, headerToken);
    if (!isValid) {
      return {
        error: new NextResponse('Invalid CSRF Token', { status: 403 }),
        shouldSetCookie: false,
      };
    }
  }

  // トークンがない場合は生成
  let token = cookieToken;
  let shouldSetCookie = false;
  if (!token) {
    token = generateCsrfToken();
    shouldSetCookie = true;
  }

  return { token, shouldSetCookie };
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
