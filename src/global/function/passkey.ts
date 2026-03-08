import 'server-only';

import { Database, Passkey } from '@/db/kysely';
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { Kysely } from 'kysely';
import { cookies } from 'next/headers';
import META_DATA from '../define/metadata';
import { hashFingerprintWithPepper } from './encrypt';

/**
 * クライアントハッシュにペッパーを付加して再ハッシュする（二段ハッシュ）
 * @param clientHash クライアントがSHA-256でハッシュ済みのフィンガープリント文字列
 * @returns サーバー側ペッパー付きのSHA-256ハッシュ（16進数文字列）
 */
export const hashFingerprint = (clientHash: string): string =>
  hashFingerprintWithPepper(clientHash, META_DATA.FP_PEPPER);

/**
 * 同一デバイスが別アカウントに登録済みかを確認する
 * @param client DBクライアント
 * @param fpHash サーバー側で計算したフィンガープリントハッシュ
 * @param uuid 現在の登録ユーザーのUUID（自分自身は除外する）
 * @returns 別ユーザーに同じハッシュが存在すればtrue
 */
export const isFpDuplicate = async (
  client: Kysely<Database>,
  fpHash: string,
  uuid: string
): Promise<boolean> => {
  // 空文字は未収集として重複チェックをスキップ
  if (!fpHash) return false;
  const row = await client
    .selectFrom('passkey')
    .select(client.fn.countAll<number>().as('cnt'))
    .where('fp_hash', '=', fpHash)
    .where('uuid', '!=', uuid)
    .executeTakeFirst();
  return (row?.cnt ?? 0) > 0;
};

/**
 * challenge Cookieのキー名を取得する
 * @note __Host- プレフィックスはhttpsでのみ有効なため、開発環境では通常のキー名を使用する
 */
const getChallengeCookieKey = (isSecure: boolean) =>
  isSecure ? '__Host-passkey_challenge' : 'passkey_challenge';

/**
 * WebAuthn RPの設定を取得する
 * @note originはNEXT_PUBLIC_ORIGIN_URLから取得し、末尾スラッシュを除去する
 */
const getRpSettings = () => {
  // 末尾のスラッシュを除去してWebAuthnのorigin形式に合わせる
  const origin = META_DATA.ORIGIN_URL.replace(/\/$/, '');
  return {
    rpName: META_DATA.RP_NAME,
    rpID: META_DATA.RP_ID,
    origin,
  };
};

/**
 * challengeをCookieに保存する
 * @param challenge challengeバイト列
 */
export const storeChallenge = async (challenge: string) => {
  const { origin } = getRpSettings();
  // localhostのhttpではsecure Cookieが送れないため、https以外はsecure=false
  const isSecure = origin.startsWith('https://');
  const cookieKey = getChallengeCookieKey(isSecure);
  const cookieStore = await cookies();
  cookieStore.set(cookieKey, challenge, {
    maxAge: 300,
    sameSite: 'strict',
    httpOnly: true,
    secure: isSecure,
    path: '/',
  });
};

/**
 * CookieからchallengeをBASE64URL文字列として取得し、Cookieを削除する
 * @returns challenge文字列（存在しない場合はundefined）
 */
export const consumeChallenge = async (): Promise<string | undefined> => {
  const { origin } = getRpSettings();
  const isSecure = origin.startsWith('https://');
  const cookieKey = getChallengeCookieKey(isSecure);
  const cookieStore = await cookies();
  const challenge = cookieStore.get(cookieKey)?.value;
  cookieStore.set(cookieKey, '', { maxAge: 0, path: '/' });
  return challenge;
};

/**
 * 登録オプションを生成する
 * @param uuid ユーザーのUUID
 * @param userName ユーザー名（アカウント識別用）
 * @param existingCredentialIds 既存クレデンシャルID一覧（重複登録防止）
 */
export const createRegistrationOptions = async (
  uuid: string,
  userName: string,
  existingCredentialIds: string[]
): Promise<PublicKeyCredentialCreationOptionsJSON> => {
  const { rpName, rpID } = getRpSettings();

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new TextEncoder().encode(uuid),
    userName,
    attestationType: 'none',
    // 既存のPasskeyと同じデバイスへの重複登録を防止
    excludeCredentials: existingCredentialIds.map((id) => ({
      id,
      transports: ['internal', 'hybrid'],
    })),
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'preferred',
    },
  });

  await storeChallenge(options.challenge);
  return options;
};

/**
 * 登録レスポンスを検証し、成功したらパスキー情報を返す
 * @param response クライアントからの登録レスポンス
 * @param deviceName デバイス名
 * @returns 保存用パスキー情報（失敗時はundefined）
 */
export const verifyPasskeyRegistration = async (
  response: RegistrationResponseJSON,
  deviceName: string
): Promise<
  { credential_id: string; public_key: string; device_name: string; counter: number } | undefined
> => {
  const expectedChallenge = await consumeChallenge();
  if (!expectedChallenge) return undefined;

  const { rpID, origin } = getRpSettings();

  const result = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (!result.verified || !result.registrationInfo) return undefined;

  const { credential } = result.registrationInfo;
  return {
    credential_id: credential.id,
    public_key: isoBase64URL.fromBuffer(credential.publicKey),
    device_name: deviceName,
    counter: credential.counter,
  };
};

/**
 * 認証オプションを生成する
 */
export const createAuthenticationOptions =
  async (): Promise<PublicKeyCredentialRequestOptionsJSON> => {
    const { rpID } = getRpSettings();

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
    });

    await storeChallenge(options.challenge);
    return options;
  };

/**
 * 認証レスポンスを検証する
 * @param response クライアントからの認証レスポンス
 * @param passkey DBから取得したパスキー情報
 * @returns 新しいカウンタ値（失敗時はundefined）
 */
export const verifyPasskeyAuthentication = async (
  response: AuthenticationResponseJSON,
  passkey: Passkey
): Promise<number | undefined> => {
  const expectedChallenge = await consumeChallenge();
  if (!expectedChallenge) return undefined;

  const { rpID, origin } = getRpSettings();

  const result = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: passkey.credential_id,
      publicKey: isoBase64URL.toBuffer(passkey.public_key),
      counter: passkey.counter,
    },
  });

  if (!result.verified) return undefined;
  return result.authenticationInfo.newCounter;
};

/**
 * credential_idからDBのPasskey情報を取得する
 * @param client DBクライアント
 * @param credentialId クレデンシャルID
 */
export const getPasskeyByCredentialId = async (
  client: Kysely<Database>,
  credentialId: string
): Promise<Passkey | undefined> =>
  await client
    .selectFrom('passkey')
    .selectAll()
    .where('credential_id', '=', credentialId)
    .executeTakeFirst();

/**
 * ユーザーのPasskey一覧を取得する
 * @param client DBクライアント
 * @param uuid ユーザーUUID
 */
export const getPasskeysByUuid = async (
  client: Kysely<Database>,
  uuid: string
): Promise<Passkey[]> =>
  await client
    .selectFrom('passkey')
    .select([
      'credential_id',
      'uuid',
      'device_name',
      'created_at',
      'public_key',
      'counter',
      'fp_hash',
    ])
    .where('uuid', '=', uuid)
    .orderBy('created_at', 'desc')
    .execute();
