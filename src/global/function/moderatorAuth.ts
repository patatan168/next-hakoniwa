/**
 * @module moderatorAuth
 * @description 管理者向けセッションの発行・検証・破棄を行う。
 */
import { Database, isSqlite } from '@/db/kysely';
import { es384Gen, randomString } from '@/global/function/encrypt';
import * as jwt from 'jsonwebtoken';
import { Kysely, sql, Transaction } from 'kysely';

export const MODERATOR_SESSION_COOKIE_NAME = '__Host-Http-moderator_session';

export const MODERATOR_SESSION_EXPIRES_HOUR = Number(
  process.env.MODERATOR_SESSION_EXPIRES_HOUR ?? process.env.ACCESS_TOKEN_EXPIRES_HOUR ?? 12
);

const moderatorJwtIssuer = process.env.ISSUER ?? 'hakoniwa';

type ModeratorJwtPayload = {
  session_id: string;
};

type VerifiedModeratorToken = {
  sessionId: string;
  uuid: string;
};

type ModeratorSessionTokenValidation = {
  valid: boolean;
  uuid?: string;
  sessionId?: string;
  shouldDeleteSession: boolean;
};

const jwtPayload = (sessionId: string): ModeratorJwtPayload => ({ session_id: sessionId });

const jwtOptions = (uuid: string, jwtid: string): jwt.SignOptions => ({
  algorithm: 'ES384',
  issuer: moderatorJwtIssuer,
  subject: uuid,
  jwtid,
  expiresIn: `${MODERATOR_SESSION_EXPIRES_HOUR}hour`,
});

function decodeModeratorJwtToken(token: string): VerifiedModeratorToken | undefined {
  const rawToken = jwt.decode(token, { json: true }) as jwt.JwtPayload | null;
  if (!rawToken || rawToken.iss !== moderatorJwtIssuer) {
    return undefined;
  }

  const uuid = rawToken.sub;
  const sessionId = rawToken.session_id;
  if (typeof uuid !== 'string' || typeof sessionId !== 'string') {
    return undefined;
  }

  return { uuid, sessionId };
}

export async function validateModeratorSessionToken(
  client: Kysely<Database> | Transaction<Database>,
  token: string
): Promise<ModeratorSessionTokenValidation> {
  const decoded = decodeModeratorJwtToken(token);
  if (!decoded) {
    return { valid: false, shouldDeleteSession: false };
  }

  const tokenData = await client
    .selectFrom('moderator_session')
    .select(['public_key', 'expires'])
    .where('uuid', '=', decoded.uuid)
    .where('session_id', '=', decoded.sessionId)
    .executeTakeFirst();

  if (!tokenData) {
    return {
      valid: false,
      uuid: decoded.uuid,
      sessionId: decoded.sessionId,
      shouldDeleteSession: false,
    };
  }

  try {
    jwt.verify(token, tokenData.public_key, {
      algorithms: ['ES384'],
      issuer: moderatorJwtIssuer,
      subject: decoded.uuid,
    });
  } catch {
    return {
      valid: false,
      uuid: decoded.uuid,
      sessionId: decoded.sessionId,
      shouldDeleteSession: false,
    };
  }

  const expires = new Date(tokenData.expires);
  if (Number.isNaN(expires.getTime()) || expires.getTime() <= Date.now()) {
    return {
      valid: false,
      uuid: decoded.uuid,
      sessionId: decoded.sessionId,
      shouldDeleteSession: true,
    };
  }

  return {
    valid: true,
    uuid: decoded.uuid,
    sessionId: decoded.sessionId,
    shouldDeleteSession: false,
  };
}

const moderatorSessionExpiresSql = () =>
  isSqlite
    ? sql<string>`datetime(unixepoch() + ${MODERATOR_SESSION_EXPIRES_HOUR} * 3600, 'unixepoch')`
    : sql<string>`DATE_ADD(NOW(), INTERVAL ${MODERATOR_SESSION_EXPIRES_HOUR} HOUR)`;

async function setModeratorSessionCookie(sessionId: string): Promise<void> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  cookieStore.set(MODERATOR_SESSION_COOKIE_NAME, sessionId, {
    maxAge: MODERATOR_SESSION_EXPIRES_HOUR * 60 * 60,
    sameSite: 'strict',
    httpOnly: true,
    secure: true,
    path: '/',
  });
}

async function deleteModeratorSessionCookie(): Promise<void> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  cookieStore.set(MODERATOR_SESSION_COOKIE_NAME, '', {
    maxAge: 0,
    sameSite: 'strict',
    httpOnly: true,
    secure: true,
    path: '/',
  });
}

async function getModeratorSessionCookie(): Promise<string | undefined> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  return cookieStore.get(MODERATOR_SESSION_COOKIE_NAME)?.value;
}

export async function createModeratorSession(
  client: Kysely<Database> | Transaction<Database>,
  uuid: string
): Promise<void> {
  const { privateKey, publicKey } = es384Gen();
  const jwtid = Math.trunc(Math.random() * Number.MAX_SAFE_INTEGER).toString();
  const sessionId = randomString(128);

  await client.transaction().execute(async (trx) => {
    await trx.deleteFrom('moderator_session').where('uuid', '=', uuid).execute();
    await trx
      .insertInto('moderator_session')
      .values({
        session_id: sessionId,
        uuid,
        public_key: publicKey,
        expires: moderatorSessionExpiresSql(),
      })
      .execute();
  });

  const token = jwt.sign(jwtPayload(sessionId), privateKey, jwtOptions(uuid, jwtid));
  await setModeratorSessionCookie(token);
}

export async function validModeratorSession(
  client: Kysely<Database> | Transaction<Database>
): Promise<string | undefined> {
  const token = await getModeratorSessionCookie();
  if (!token) return undefined;

  const verified = await validateModeratorSessionToken(client, token);
  if (!verified.valid || !verified.uuid) {
    if (verified.shouldDeleteSession && verified.uuid && verified.sessionId) {
      await client
        .deleteFrom('moderator_session')
        .where('session_id', '=', verified.sessionId)
        .where('uuid', '=', verified.uuid)
        .execute();
    }
    return undefined;
  }

  return verified.uuid;
}

export async function deleteModeratorSession(
  client: Kysely<Database> | Transaction<Database>
): Promise<void> {
  const token = await getModeratorSessionCookie();
  if (token) {
    const verified = await validateModeratorSessionToken(client, token);
    if (verified.uuid && verified.sessionId) {
      await client
        .deleteFrom('moderator_session')
        .where('session_id', '=', verified.sessionId)
        .where('uuid', '=', verified.uuid)
        .execute();
    }
  }
  await deleteModeratorSessionCookie();
}
