/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyAsyncFunction = (signal: AbortSignal, ...args: any[]) => Promise<any>;

export function reactDebounce<F extends AnyAsyncFunction>(
  func: F, // 直接 F を受けるようにする
  wait: number
) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let controller: AbortController | null = null;

  // func の引数から AbortSignal を除いたもの（実際のデータ引数）を抽出
  type ArgsWithoutSignal = F extends (signal: AbortSignal, ...args: infer P) => any ? P : never;

  return (...args: ArgsWithoutSignal): Promise<Awaited<ReturnType<F>> | void> => {
    if (timeout) clearTimeout(timeout);
    if (controller) controller.abort();

    controller = new AbortController();
    const { signal } = controller;

    return new Promise((resolve, reject) => {
      timeout = setTimeout(async () => {
        try {
          // signal を先頭に、残りの引数を展開して渡す
          const result = await func(signal, ...args);
          if (!signal.aborted) {
            resolve(result);
          }
        } catch (error: any) {
          if (error.name === 'AbortError') return;
          reject(error);
        } finally {
          controller = null;
        }
      }, wait);
    });
  };
}
