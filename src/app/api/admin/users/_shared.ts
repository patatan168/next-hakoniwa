import { NextRequest, NextResponse } from 'next/server';

export type ResolvedAdminContext = {
  adminUuid: string;
  adminRole: number;
};

export function resolveAdminContext(request: NextRequest): {
  context?: ResolvedAdminContext;
  error?: NextResponse;
} {
  const adminUuid = request.headers.get('x-verified-admin-uuid');
  if (!adminUuid) {
    return { error: NextResponse.json({ error: '認証に失敗しました。' }, { status: 401 }) };
  }

  const adminRoleRaw = request.headers.get('x-verified-admin-role');
  if (adminRoleRaw === null) {
    return { error: NextResponse.json({ error: '認証に失敗しました。' }, { status: 401 }) };
  }

  const adminRole = Number(adminRoleRaw);
  if (!Number.isFinite(adminRole)) {
    return { error: NextResponse.json({ error: '認証に失敗しました。' }, { status: 401 }) };
  }

  return {
    context: {
      adminUuid,
      adminRole,
    },
  };
}
