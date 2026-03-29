/**
 * @module turnPhases
 * @description ターン処理の主要フェーズを全島まとめて実行するヘルパー。
 */

type IslandPhaseHandler<T> = (island: T, index: number) => void;

type RunIslandTurnPhasesArgs<T> = {
  islands: T[];
  randomIndices: number[];
  incomeAndEatenPhase: IslandPhaseHandler<T>;
  planPhase: IslandPhaseHandler<T>;
  mapScanPhase: IslandPhaseHandler<T>;
  wideIslandEventPhase: IslandPhaseHandler<T>;
};

const runPhase = <T>(islands: T[], randomIndices: number[], handler: IslandPhaseHandler<T>) => {
  for (const index of randomIndices) {
    const island = islands[index];
    if (!island) continue;
    handler(island, index);
  }
};

/**
 * 全島の収入・計画・単ヘックス処理・島全体イベントを実行する。
 * 計画による他島への影響を、そのターン中の全島イベント判定に確実に反映させるため、
 * 1島ずつ完結させずフェーズ単位で全島を走査する。
 */
export const runIslandTurnPhases = <T>({
  islands,
  randomIndices,
  incomeAndEatenPhase,
  planPhase,
  mapScanPhase,
  wideIslandEventPhase,
}: RunIslandTurnPhasesArgs<T>) => {
  runPhase(islands, randomIndices, incomeAndEatenPhase);
  runPhase(islands, randomIndices, planPhase);
  runPhase(islands, randomIndices, mapScanPhase);
  runPhase(islands, randomIndices, wideIslandEventPhase);
};
