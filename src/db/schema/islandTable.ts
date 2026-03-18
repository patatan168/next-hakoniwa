/**
 * @module islandTable
 * @description 島テーブルのスキーマ定義。
 */
import { getPublicIslandInfo } from '@/global/function/island';
import type { EventRate, Island, User } from '../kysely';
import type { islandInfoData } from './islandTypes';

export type islandData = Array<Island>;

/**
 * ターン進行用の拡張島情報型
 * Selectable<IslandTable> をベースに、User 名やイベントレート、
 * ターン実行中のみ使用する一時的なプロパティを追加。
 * JSON カラム（island_info）と文字列カラム（prize）を扱う拡張型。
 */
export interface islandInfoTurnProgress
  extends Island, Omit<EventRate, 'uuid'>, Pick<User, 'island_name'> {
  /** 人工怪獣出現数 */
  artificialMonster: number;
  /** モノリス落下数 */
  fallMonument: number;
}

/**
 * JSON型のカラム値をオブジェクトに解決する (Kyselyプラグインが未実行の場合のフォールバック)
 * @param value カラムの値（文字列、オブジェクト、またはjsonb由来のBuffer形式）
 * @returns パース済みのオブジェクト
 */
function resolveJsonColumn(value: unknown): unknown {
  if (typeof value === 'string') {
    return JSON.parse(value);
  }
  // SQLiteのjsonbがBufferオブジェクトとして返ってきた場合への対応
  if (
    value &&
    typeof value === 'object' &&
    'type' in value &&
    (value as { type: string }).type === 'Buffer' &&
    'data' in value &&
    Array.isArray((value as { data: unknown }).data)
  ) {
    return JSON.parse(Buffer.from((value as { data: number[] }).data).toString());
  }
  return value;
}

/**
 * JSON ColumをObjectに変換
 * @param island islandテーブルのデーター
 * @param isPublic 公開データか
 */
export const parseJsonIslandData = <T extends Island>(
  island: T | islandInfoTurnProgress,
  isPublic = true
) => {
  const mutIsland = island as unknown as {
    prize: unknown;
    island_info: unknown;
    missile: number;
    money: number;
  };

  mutIsland.prize = typeof mutIsland.prize === 'string' ? mutIsland.prize : '';

  if (typeof mutIsland.island_info === 'string') {
    const parsed = resolveJsonColumn(mutIsland.island_info);
    mutIsland.island_info = isPublic
      ? getPublicIslandInfo(parsed as islandInfoData)
      : (parsed as islandInfoData);
  } else if (isPublic) {
    // すでにオブジェクトであっても、公開データならフィルタリングを行う
    mutIsland.island_info = getPublicIslandInfo(mutIsland.island_info as islandInfoData);
  }

  if (isPublic) {
    mutIsland.missile = 0;
    mutIsland.money = Math.round(mutIsland.money / 1000) * 1000;
  }
};

/**
 * JSON ColumをObjectに変換 (Turn進行用のkeyを初期化)
 * @param island islandテーブルのデーター
 * @param isPublic 公開データか
 */
export const parseJsonIslandDataTurnProgress = (
  island: islandInfoTurnProgress,
  isPublic = true
) => {
  parseJsonIslandData(island, isPublic);
  island.artificialMonster = 0;
  island.fallMonument = 0;
};
