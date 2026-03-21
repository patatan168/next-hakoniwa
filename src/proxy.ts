/**
 * @module proxy
 * @description Next.jsミドルウェア。CSP・認証・CSRF・セッションチェックを行うプロキシ処理。
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from './db/kysely';
import { validAuthCookie } from './global/function/auth';
import { CSRF_COOKIE_NAME, generateCsrfToken, verifyCsrfToken } from './global/function/csrf';
import {
  MODERATOR_SESSION_COOKIE_NAME,
  validateModeratorSessionToken,
} from './global/function/moderatorAuth';

const authPaths = ['/api/auth/'];
const adminApiPaths = ['/api/admin/'];
const adminApiExcludePaths = ['/api/admin/sign-in', '/api/admin/sign-out'];
const sessionPaths = ['/development', '/account'];
const moderatorSessionPaths = ['/admin/'];
const excludeNoncePaths = ['/api'];

/**
 * リクエストのプロキシ処理。CSRF・認証・セッション・CSPの各チェックを実行する。
 * @param request - 受信リクエスト
 * @returns レスポンス
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const csrfResult = await csrfCheck(request);
  if (csrfResult.error) return csrfResult.error;

  let response: NextResponse;
  if (authPaths.some((prefix) => pathname.startsWith(prefix))) {
    response = await authCheck(request);
  } else if (adminApiPaths.some((prefix) => pathname.startsWith(prefix))) {
    response = await adminApiAuthCheck(request);
  } else if (sessionPaths.some((prefix) => pathname.startsWith(prefix))) {
    response = await sessionCheck(request);
  } else if (moderatorSessionPaths.some((prefix) => pathname.startsWith(prefix))) {
    response = await moderatorSessionCheck(request);
  } else if (excludeNoncePaths.some((prefix) => pathname.startsWith(prefix))) {
    response = NextResponse.next({});
  } else {
    response = crateNonceResponse(request);
  }

  if (csrfResult.shouldSetCookie && csrfResult.token) {
    response.cookies.set(CSRF_COOKIE_NAME, csrfResult.token, {
      httpOnly: false,
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

/**
 * CSPヘッダー文字列を生成する。
 * @param nonce - スクリプト用nonce値
 * @returns CSPヘッダー文字列
 */
function getCspHeader(nonce: string) {
  const baseHeader =
    "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; object-src 'none'; frame-ancestors 'none'; upgrade-insecure-requests; worker-src 'self'; manifest-src 'self';";
  const scriptStr =
    process.env.NODE_ENV === 'development'
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; "
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic';`;
  return `${baseHeader} ${scriptStr}`;
}

/**
 * nonce付きCSPヘッダーを設定したレスポンスを生成する。
 * @param request - 受信リクエスト
 * @returns nonce付きレスポンス
 */
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

/**
 * 認証チェック。JWTトークンの有効性を検証し、UUIDをヘッダーにセットする。
 * @param request - 受信リクエスト
 * @returns 認証済みレスポンスまたは401リダイレクト
 */
async function authCheck(request: NextRequest) {
  try {
    const uuid = await validAuthCookie(db, true);
    if (uuid) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-verified-uuid', uuid);
      return NextResponse.next({ headers: requestHeaders });
    }
  } catch {
    // 認証エラーは 401 リダイレクトで処理
  }
  return NextResponse.redirect(new URL(`/error/401`, request.url));
}

/**
 * セッションチェック。認証済みならnonce付きレスポンスを返す。
 * @param request - 受信リクエスト
 * @returns nonce付きレスポンスまたは401リダイレクト
 */
async function sessionCheck(request: NextRequest) {
  try {
    const uuid = await validAuthCookie(db, true);
    if (uuid) {
      return crateNonceResponse(request);
    }
  } catch {
    // 認証エラーは 401 リダイレクトで処理
  }
  return NextResponse.redirect(new URL(`/error/401`, request.url));
}

/**
 * 管理者API認証チェック。/api/admin/*（/api/admin/sign-inおよび/api/admin/sign-outは除外）を管理者セッションで保護する。
 * @param request - 受信リクエスト
 * @returns 認証済みレスポンスまたは401レスポンス
 */
async function adminApiAuthCheck(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (adminApiExcludePaths.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next({});
  }

  const token = request.cookies.get(MODERATOR_SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: '認証に失敗しました。' }, { status: 401 });
  }

  const verified = await validateModeratorSessionToken(db, token);
  if (!verified.valid || !verified.uuid || !verified.sessionId) {
    if (verified.shouldDeleteSession && verified.uuid && verified.sessionId) {
      await db
        .deleteFrom('moderator_session')
        .where('session_id', '=', verified.sessionId)
        .where('uuid', '=', verified.uuid)
        .execute();
    }
    return NextResponse.json({ error: '認証に失敗しました。' }, { status: 401 });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-verified-admin-uuid', verified.uuid);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * 管理者セッションチェック。/admin/*（/adminは除外）へのアクセスを管理者セッションで保護する。
 * @param request - 受信リクエスト
 * @returns nonce付きレスポンスまたは /admin リダイレクト
 */
async function moderatorSessionCheck(request: NextRequest) {
  const token = request.cookies.get(MODERATOR_SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL(`/error/401`, request.url));
  }

  const verified = await validateModeratorSessionToken(db, token);
  if (!verified.valid || !verified.uuid || !verified.sessionId) {
    if (verified.shouldDeleteSession && verified.uuid && verified.sessionId) {
      await db
        .deleteFrom('moderator_session')
        .where('session_id', '=', verified.sessionId)
        .where('uuid', '=', verified.uuid)
        .execute();
    }
    return NextResponse.redirect(new URL(`/error/401`, request.url));
  }

  return crateNonceResponse(request);
}
