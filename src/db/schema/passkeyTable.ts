import { DbSchema } from '@/global/function/db';

export const passkeySchema: DbSchema = [
  {
    name: 'credential_id',
    type: 'TEXT',
    primary: true,
    unique: true,
  },
  {
    name: 'uuid',
    type: 'TEXT',
    foreign: { table: 'user', name: 'uuid' },
  },
  /** BASE64URLエンコードされた公開鍵 */
  { name: 'public_key', type: 'TEXT' },
  /** ユーザーが識別しやすいデバイス名 */
  { name: 'device_name', type: 'TEXT' },
  /** リプレイアタック防止カウンタ */
  { name: 'counter', type: 'INTEGER', defVal: '0' },
  // NOTE: セキュアでなくて良いため、ミリ秒ではなく秒で保存
  { name: 'created_at', type: 'INTEGER', defVal: 'unixepoch()' },
];

export type passkeySchemaType = {
  /** WebAuthnクレデンシャルの一意ID (BASE64URL) */
  credential_id: string;
  /** 所有ユーザーのUUID */
  uuid: string;
  /** 公開鍵 (BASE64URL) */
  public_key: string;
  /** デバイス名 */
  device_name: string;
  /** リプレイアタック防止カウンタ */
  counter: number;
  /** 登録日時 (unix秒) */
  created_at: number;
};
