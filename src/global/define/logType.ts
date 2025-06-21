import { islandSchemaType } from '@/db/schema/islandTable';
import { mapArrayConverter } from '../function/island';
import { getMapDefine, getMapName } from './mapType';
import META_DATA from './metadata';
import { planType } from './planType';

/**
 * 座標を表す文字列を返す
 * @param x X座標
 * @param y Y座標
 * @param isSecret 非公開か
 * @returns 座標
 */
const coordinate = (x: number, y: number, isSecret = false): string => {
  return isSecret ? '(?, ?)' : `(${x}, ${y})`;
};

/**
 * コストが十分でない場合のログ
 * @param island 島情報
 * @param plan 計画情報
 * @returns ログ
 */
export const logLackCosts = (island: islandSchemaType, plan: planType): string => {
  const lackCost = plan.costType === 'money' ? '資金' : '備蓄食料';
  return `${island.island_name}島で予定されていた${plan.name}は、${lackCost}不足のため中止されました。`;
};

/**
 * 予定地が無効な場合のログ
 * @param island 島情報
 * @param plan 計画情報
 * @param x X座標
 * @param y Y座標
 * @returns ログ
 */
export const logLandFail = (
  island: islandSchemaType,
  plan: planType,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const defineMapName = getMapDefine(mapInfo.type).name;
  const mapName = getMapName(mapInfo.type, mapInfo.landValue, defineMapName);
  return `${island.island_name}島で予定されていた${plan.name}は、予定地の${coordinate(x, y)}が${mapName}だったため中止されました。`;
};

/**
 * 予定地の周辺に陸地が無い場合のログ
 * @param island 島情報
 * @param plan 計画情報
 * @param x X座標
 * @param y Y座標
 * @returns ログ
 */
export const logNoLandAround = (
  island: islandSchemaType,
  plan: planType,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const defineMapName = getMapDefine(mapInfo.type).name;
  const mapName = getMapName(mapInfo.type, mapInfo.landValue, defineMapName);
  return `${island.island_name}島で予定されていた${plan.name}は、予定地の${coordinate(x, y)}の${mapName}の周辺に陸地が無かったため中止されました。`;
};

/**
 * 共通の開発ログ
 * @param island 島情報
 * @param plan 計画情報
 * @param x X座標
 * @param y Y座標
 * @param isSecret 非公開か
 * @returns ログ
 */
export const logCommonDev = (
  island: islandSchemaType,
  plan: planType,
  x: number,
  y: number,
  isSecret = false
): string => {
  return `${island.island_name}島${coordinate(x, y, isSecret)}で${plan.name}が行われました。`;
};

/**
 * 複数回実行の開発ログ
 * @param island 島情報
 * @param plan 計画情報
 * @param x X座標
 * @param y Y座標
 * @param isSecret 非公開か
 * @returns ログ
 */
export const logAnyTimesDev = (
  island: islandSchemaType,
  plan: planType,
  x: number,
  y: number,
  times: number,
  isSecret = false
): string => {
  const timesLog = times > 1 ? `${times}回、` : '';
  return `${island.island_name}島${coordinate(x, y, isSecret)}で${plan.name}が${timesLog}行われました。`;
};

/**
 * 森の開発ログ
 * @param island 島情報
 * @returns ログ
 */
export const logForest = (island: islandSchemaType): string => {
  return `こころなしか、${island.island_name}島の森が増えたようです。`;
};

/**
 * 水没のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns ログ
 */
export const logSubmersion = (island: islandSchemaType, x: number, y: number): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { baseLand, name } = getMapDefine(mapInfo.type);
  const seaType = ['sea', 'submarine_missile', 'oil_field'];
  const submersionLog = seaType.includes(baseLand) ? '跡形もなくなりました。' : '水没しました。';

  return `${island.island_name}島${coordinate(x, y)}の${name}は${submersionLog}`;
};

/**
 * 怪獣水没のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns ログ
 */
export const logMonsterSubmersion = (island: islandSchemaType, x: number, y: number): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { name } = getMapDefine(mapInfo.type);

  return `${island.island_name}島${coordinate(x, y)}の陸地は${name}もろとも水没しました。`;
};

/**
 * 荒地化のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns ログ
 */
export const logDamageWaste = (island: islandSchemaType, x: number, y: number): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { name } = getMapDefine(mapInfo.type);

  return `${island.island_name}島${coordinate(x, y)}の${name}は一瞬にして荒地と化しました。`;
};

/**
 * 怪獣が消し飛ぶログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns ログ
 */
export const logScatterMonster = (island: islandSchemaType, x: number, y: number): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { name } = getMapDefine(mapInfo.type);

  return `${island.island_name}島${coordinate(x, y)}の${name}は消し飛びました。`;
};

/**
 * 自爆装置セットのログ
 * @param island 島情報
 * @param plan 計画情報
 * @param x X座標
 * @param y Y座標
 * @returns ログ
 */
export const logSetSelfCrash = (
  island: islandSchemaType,
  plan: planType,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { name } = getMapDefine(mapInfo.type);

  return `${island.island_name}島${coordinate(x, y)}で${name}の自爆装置がセットされました。`;
};

/**
 * 自爆のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns ログ
 */
export const logSelfCrash = (island: islandSchemaType, x: number, y: number): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { name } = getMapDefine(mapInfo.type);

  return `${island.island_name}島${coordinate(x, y)}の${name}、自爆装置作動！！`;
};

/**
 * 石油採掘のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @param earn 収益
 * @returns ログ
 */
export const logOilEarned = (
  island: islandSchemaType,
  x: number,
  y: number,
  earn: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { name } = getMapDefine(mapInfo.type);

  return `${island.island_name}島${coordinate(x, y)}の${name}から、${earn}${META_DATA.UNIT_MONEY}の収益が上がりました。`;
};

/**
 * 石油枯渇のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns ログ
 */
export const logOilEnd = (island: islandSchemaType, x: number, y: number): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { name } = getMapDefine(mapInfo.type);

  return `${island.island_name}島${coordinate(x, y)}の${name}は枯渇したようです。`;
};

/**
 * 火災のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns ログ
 */
export const logFire = (island: islandSchemaType, x: number, y: number): string => {
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { name } = getMapDefine(mapInfo.type);

  return `${island.island_name}島${coordinate(x, y)}の${name}が火災により壊滅しました。`;
};
