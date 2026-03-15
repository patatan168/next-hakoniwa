import { TurnLog } from '@/db/kysely';
import { isEqual } from 'es-toolkit';
import { forwardRef, memo, Ref } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { TransformHTML } from './TransFormHTML';

type TurnLogProps = {
  className?: string;
  style?: React.CSSProperties;
  logs:
    | (Omit<TurnLog, 'log' | 'secret_log'> & {
        log?: string | null;
        secret_log?: string;
      })[]
    | undefined;
  setLazyFlag: (value: boolean) => void;
};

export default memo(
  forwardRef<VirtuosoHandle, TurnLogProps>(function TurnLog(
    { className, style, logs, setLazyFlag }: TurnLogProps,
    ref: Ref<VirtuosoHandle>
  ) {
    const ready = logs !== undefined && logs.length > 0;

    if (logs !== undefined && logs.length === 0) {
      return (
        <div className={`p-4 text-center text-gray-500 ${className ?? ''}`}>
          まだ開発記録がありません。
        </div>
      );
    }

    if (!ready) return null;

    return (
      <Virtuoso
        ref={ref}
        className={className}
        style={style}
        data={logs}
        atBottomStateChange={(atBottom) => {
          setLazyFlag(atBottom);
        }}
        atBottomThreshold={150}
        itemContent={(index, log) => {
          const logText = log.secret_log ? log.secret_log : (log.log ?? '');
          return (
            <>
              {index > 0 && log.turn !== logs?.[index - 1].turn && (
                <hr className="my-2 border-gray-300 dark:border-gray-600" />
              )}
              <div className="flex gap-1 px-2 text-xs sm:text-sm md:text-base">
                <div className="whitespace-nowrap">{`ターン ${log.turn} : `}</div>
                <div className="min-w-0 break-words">
                  <TransformHTML html={logText} />
                </div>
              </div>
            </>
          );
        }}
      />
    );
  }),
  (oldProps, newProps) => isEqual(oldProps, newProps)
);
