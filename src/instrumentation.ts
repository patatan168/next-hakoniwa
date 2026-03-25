/**
 * @module instrumentation
 * @description Next.jsの計測初期化処理。サーバー起動時にDB接続・マイグレーションを実行する。
 */
let isIntervalSetup = false;

/**
 * Next.jsサーバー起動時の初期化処理。DBマイグレーションとターンスケジューラを設定する。
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && !isIntervalSetup) {
    isIntervalSetup = true;

    const { spawn } = await import('child_process');
    const { Cron } = await import('croner');

    const cronStr = process.env.NEXT_PUBLIC_TURN_CRON;
    if (!cronStr) {
      console.log(
        '[TurnScheduler] NEXT_PUBLIC_TURN_CRON is not defined. Turn auto-update is disabled.'
      );
      return;
    }

    try {
      const tz = process.env.NEXT_PUBLIC_TURN_TIMEZONE;
      // cronerを用いてパース、スケジュール登録（書式が不正であればここでエラーになる）
      const job = new Cron(cronStr, { timezone: tz }, () => {
        console.log('[TurnScheduler] Executing turn script (cron triggered)...');
        // npm を経由せず node を直接起動し、オーバーヘッドを抑える
        const child = spawn(process.execPath, ['--import', 'tsx', './src/db/turn.ts'], {
          stdio: 'inherit',
          shell: false,
          env: process.env,
        });

        child.on('error', (err) => {
          console.error('[TurnScheduler] Error executing turn script:', err);
        });

        child.on('close', (code) => {
          if (code !== 0) {
            console.error(`[TurnScheduler] turn process exited with code ${code}`);
          } else {
            console.log('[TurnScheduler] Turn progress execution completed successfully.');
          }
        });
      });

      console.log(`[TurnScheduler] Auto-update scheduled with cron: ${cronStr}`);
      console.log(`[TurnScheduler] Next execution at: ${job.nextRun()?.toISOString()}`);
    } catch (e) {
      console.error(
        `[TurnScheduler] Invalid cron expression: ${cronStr}. Auto-update is disabled.`,
        e
      );
    }
  }
}
