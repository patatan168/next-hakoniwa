/**
 * @module admin-api/users
 * @description ユーザー一覧取得API。
 */
import { db } from '@/db/kysely';
import { accessLogger } from '@/global/function/logger';
import { NextRequest, NextResponse } from 'next/server';
import { resolveAdminContext } from './_shared';

type UserSummary = {
  uuid: string;
  userName: string;
  islandName: string;
  isLocked: boolean;
  lockedUntil: string | null;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function parsePositiveNumber(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const intValue = Math.trunc(parsed);
  return intValue > 0 ? intValue : fallback;
}

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET(request: NextRequest) {
  const contextResult = resolveAdminContext(request);
  if (contextResult.error) return contextResult.error;
  const { adminUuid, adminRole } = contextResult.context!;

  const keyword = request.nextUrl.searchParams.get('keyword')?.trim() ?? '';
  const page = parsePositiveNumber(request.nextUrl.searchParams.get('page'), DEFAULT_PAGE);
  const pageSizeRaw = parsePositiveNumber(
    request.nextUrl.searchParams.get('pageSize'),
    DEFAULT_PAGE_SIZE
  );
  const pageSize = Math.min(pageSizeRaw, MAX_PAGE_SIZE);

  const baseQuery = db
    .selectFrom('user')
    .innerJoin('auth', 'auth.uuid', 'user.uuid')
    .where('user.inhabited', '=', 1)
    .$if(keyword.length > 0, (qb) =>
      qb.where((eb) =>
        eb.or([
          eb('user.user_name', 'like', `%${keyword}%`),
          eb('user.island_name', 'like', `%${keyword}%`),
        ])
      )
    );

  const totalResult = await baseQuery
    .select((eb) => eb.fn.count<number>('user.uuid').as('count'))
    .executeTakeFirst();
  const total = Number(totalResult?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * pageSize;

  const users = await baseQuery
    .select(['user.uuid', 'user.user_name', 'user.island_name', 'auth.locked_until'])
    .orderBy('user.user_name', 'asc')
    .offset(offset)
    .limit(pageSize)
    .execute();

  const now = Date.now();
  const result: UserSummary[] = users.map((user) => {
    const lockedUntil = user.locked_until;
    const isLocked = lockedUntil !== null && now < new Date(lockedUntil).getTime();

    return {
      uuid: user.uuid,
      userName: user.user_name,
      islandName: user.island_name,
      isLocked,
      lockedUntil,
    };
  });

  accessLogger(request).info(
    `Admin Users Listed by uuid=${adminUuid} role=${adminRole} page=${currentPage} pageSize=${pageSize} keyword=${keyword}`
  );

  return NextResponse.json({
    adminRole,
    users: result,
    page: currentPage,
    pageSize,
    total,
    totalPages,
    keyword,
  });
}
