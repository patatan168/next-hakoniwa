import { userSchemaType } from '@/db/schema/userTable';
import { asyncRequestValid, redirectPathResponse } from '@/global/function/api';
import { argon2Verify, createJwtToken, setAuthCookie, sha256Gen } from '@/global/function/auth';
import { dbConn } from '@/global/function/db';
import { accessLogger } from '@/global/function/logger';
import { signInUserInfoSchema } from '@/global/valid/userInfo';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function POST(request: NextRequest) {
  using db = dbConn('./src/db/data/main.db');

  const valid = await asyncRequestValid(request, signInUserInfoSchema);

  if (valid.data !== null) {
    const { id, password } = valid.data;
    const hashId = await sha256Gen(id);

    const user = db.client
      .prepare(`SELECT uuid, id, password FROM user WHERE id = ?`)
      .get(hashId) as userSchemaType | undefined;

    if (user !== undefined) {
      const verify = await argon2Verify(user.password, password);

      if (verify) {
        await setAuthCookie(createJwtToken(db.client, user.uuid), valid.response, request);
        accessLogger(request).info(`Sign In uuid=${user.uuid}`);

        return redirectPathResponse('/development');
      } else {
        accessLogger(request).warn(`Unauthorized Sign In`);
        return new Response('認証エラー', { status: 401 });
      }
    } else {
      accessLogger(request).warn(`Unauthorized Sign In`);
      return new Response('認証エラー', { status: 401 });
    }
  }
  return valid.response;
}
