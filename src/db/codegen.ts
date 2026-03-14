import dotenvFlow from 'dotenv-flow';
import { spawnSync } from 'node:child_process';

dotenvFlow.config({
  node_env: process.env.NODE_ENV ?? 'development',
  default_node_env: 'development',
  silent: true,
});

const dialect = process.env.DB_TYPE ?? 'sqlite';
const url = process.env.DB_CONNECTION_STRING ?? './src/db/data/prod.db';

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['kysely-codegen', `--dialect=${dialect}`, `--url=${url}`, '--out-file=./src/db/generated.d.ts'],
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
