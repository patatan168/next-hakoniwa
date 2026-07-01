/**
 * @module codegen
 * @description DB型定義の自動生成エントリポイント。
 */
import dotenvFlow from 'dotenv-flow';
import { spawnSync } from 'node:child_process';

dotenvFlow.config({
  node_env: process.env.NODE_ENV ?? 'development',
  default_node_env: 'development',
  silent: true,
});

const dialect = process.env.DB_TYPE ?? 'sqlite';
const url = process.env.DB_CONNECTION_STRING ?? './src/db/data/prod.db';

const bigintColumnOverrides = {
  columns: {
    'access_token.created_at': 'Generated<number>',
    'auth.created_at': 'Generated<number>',
    'last_login.last_bonus_received_at': 'Generated<number>',
    'last_login.last_login_at': 'Generated<number>',
    'moderator_auth.created_at': 'Generated<number>',
    'moderator_session.created_at': 'Generated<number>',
    'passkey.created_at': 'Generated<number>',
    'refresh_token.created_at': 'Generated<number>',
    'user.island_name_changed_at': 'Generated<number>',
  },
};

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  [
    'kysely-codegen',
    `--dialect=${dialect}`,
    `--url=${url}`,
    `--overrides=${JSON.stringify(bigintColumnOverrides)}`,
    '--out-file=./src/db/generated.d.ts',
  ],
  {
    stdio: 'inherit',
    shell: false,
  }
);

if (result.error) {
  throw result.error;
}

if (typeof result.status === 'number' && result.status !== 0) {
  process.exit(result.status);
}
