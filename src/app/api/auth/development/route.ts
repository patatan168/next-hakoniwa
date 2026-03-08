import { db } from '@/db/kysely';
import { islandSchemaType, parseJsonIslandData } from '@/db/schema/islandTable';
import { userSchemaType } from '@/db/schema/userTable';
import { accessLogger } from '@/global/function/logger';
import { grantLoginBonus } from '@/global/function/loginBonus';
import { sql } from 'kysely';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function GET(request: NextRequest) {
  const uuid = request.headers.get('x-verified-uuid');
  if (!uuid) {
    return NextResponse.json(
      { error: '島の取得に失敗しました。再度お試しください。' },
      { status: 401 }
    );
  }
  const islandDataRaw = await db
    .selectFrom((eb) =>
      eb
        .selectFrom('user')
        .innerJoin('island', 'user.uuid', 'island.uuid')
        .selectAll('island')
        .select([
          'user.island_name',
          sql<number>`RANK() OVER (ORDER BY island.population DESC)`.as('rank'),
        ])
        .as('ranked')
    )
    .selectAll()
    .where('uuid', '=', uuid)
    .executeTakeFirst();

  const islandData = islandDataRaw as unknown as islandSchemaType &
    Pick<userSchemaType, 'island_name'>;
  if (islandData === undefined) {
    accessLogger(request).warn(`Internal Server Error: Development uuid=${uuid}`);
    return NextResponse.json({ error: '島の取得に失敗しました。' }, { status: 500 });
  }
  parseJsonIslandData(islandData, false);

  const loginBonus = await grantLoginBonus(uuid, islandData);

  return NextResponse.json({ ...islandData, loginBonus });
}
