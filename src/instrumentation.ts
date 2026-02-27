let isIntervalSetup = false;

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
      const tz = process.env.TURN_TIMEZONE;
      // cronerを用いてパース、スケジュール登録（書式が不正であればここでエラーになる）
      const job = new Cron(cronStr, { timezone: tz }, () => {
        console.log('[TurnScheduler] Executing npm run turn (cron triggered)...');
        // Execute npm run turn in a child process so it doesn't block the main event loop
        const child = spawn('npm', ['run', 'turn'], {
          stdio: 'inherit',
          shell: true,
        });

        child.on('error', (err) => {
          console.error('[TurnScheduler] Error executing npm run turn:', err);
        });

        child.on('close', (code) => {
          if (code !== 0) {
            console.error(`[TurnScheduler] npm run turn process exited with code ${code}`);
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
