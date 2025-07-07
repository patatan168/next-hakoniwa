import { islandSchemaType } from '@/db/schema/islandTable';
import { mapArrayConverter } from '../function/island';
import { getMapDefine, getMapName, mapType } from './mapType';
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

/**
 * 怪獣の移動のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @param moveX 移動先X座標
 * @param moveY 移動先Y座標
 * @returns ログ
 */
export const logMonsterMove = (
  island: islandSchemaType,
  x: number,
  y: number,
  moveX: number,
  moveY: number
): string => {
  // 移動元の地形を取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { name } = getMapDefine(mapInfo.type);
  // 移動先の地形を取得
  const moveMapInfo = island.island_info[mapArrayConverter(moveX, moveY)];
  const { name: moveName } = getMapDefine(moveMapInfo.type);

  return `${island.island_name}島${coordinate(moveX, moveY)}の${moveName}が怪獣${name}に踏み荒らされました。`;
};

/**
 * 怪獣の自爆のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @param moveX 移動先X座標
 * @param moveY 移動先Y座標
 * @returns ログ
 */
export const logMonsterSuicideBombing = (
  island: islandSchemaType,
  x: number,
  y: number,
  moveX: number,
  moveY: number
): string => {
  // 移動元の地形を取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { name } = getMapDefine(mapInfo.type);
  // 移動先の地形を取得
  const moveMapInfo = island.island_info[mapArrayConverter(moveX, moveY)];
  const { name: moveName } = getMapDefine(moveMapInfo.type);

  return `怪獣${name}が${island.island_name}島${coordinate(moveX, moveY)}へ到達、${moveName}の自爆装置が発動！！`;
};

/**
 * 地震のログ
 * @param island 島情報
 * @returns ログ
 */
export const logEarthquake = (island: islandSchemaType): string => {
  return `${island.island_name}島で大規模な地震が発生！！`;
};

/**
 * 地震による被害のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns ログ
 */
export const logEarthquakeDamage = (island: islandSchemaType, x: number, y: number): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { name } = getMapDefine(mapInfo.type);

  return `${island.island_name}島${coordinate(x, y)}の${name}は地震により壊滅しました。`;
};

/**
 * 食糧不足のログ
 * @param island 島情報
 * @returns ログ
 */
export const logLackFoods = (island: islandSchemaType): string => {
  return `${island.island_name}島の食料が不足しています！！`;
};

/**
 * 食糧不足による被害のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns ログ
 */
export const logLackFoodsDamage = (island: islandSchemaType, x: number, y: number): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { name } = getMapDefine(mapInfo.type);

  return `${island.island_name}島${coordinate(x, y)}の${name}に食料を求めて住民が殺到。${name}は壊滅しました。`;
};

/**
 * 津波のログ
 * @param island 島情報
 * @returns ログ
 */
export const logTsunami = (island: islandSchemaType): string => {
  return `${island.island_name}島付近で津波が発生！！`;
};

/**
 * 津波による被害のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 津波による被害のログ
 */
export const logTsunamiDamage = (island: islandSchemaType, x: number, y: number): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { name } = getMapDefine(mapInfo.type);

  return `${island.island_name}島${coordinate(x, y)}の${name}は津波により崩壊しました。`;
};

/**
 * モンスター出現ログ
 * @param island 島情報
 * @param popMonsterType 出現したモンスターのタイプ
 * @param x X座標
 * @param y Y座標
 * @returns モンスター出現のログ
 */
export const logPopMonster = (
  island: islandSchemaType,
  popMonsterType: mapType,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { name } = getMapDefine(mapInfo.type);
  const monsterName = popMonsterType.name;
  return `${island.island_name}島${coordinate(x, y)}に怪獣${monsterName}が出現！！${coordinate(x, y)}の${name}が踏み荒らされました。`;
};

/**
 * 地盤沈下のログ
 * @param island 島情報
 * @returns 地盤沈下のログ
 */
export const logLandSubsidence = (island: islandSchemaType): string => {
  return `${island.island_name}島で地盤沈下が発生しました！！`;
};

/**
 * 地盤沈下による被害のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 地盤沈下による被害のログ
 */
export const logLandSubsidenceDamage = (island: islandSchemaType, x: number, y: number): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { name } = getMapDefine(mapInfo.type);

  return `${island.island_name}島${coordinate(x, y)}の${name}は海の中へ沈みました。`;
};

/**
 * 記念碑落下のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 記念碑落下のログ
 */
export const logFallMonument = (island: islandSchemaType, x: number, y: number): string => {
  return `何かとてつもないものが${island.island_name}島${coordinate(x, y)}地点に落下しました！！。`;
};

/**
 * 隕石落下のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 隕石落下のログ
 */
export const logMeteorite = (island: islandSchemaType, x: number, y: number): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { name } = getMapDefine(mapInfo.type);

  return `${island.island_name}島${coordinate(x, y)}地点の${name}に隕石が落下、一帯が水没しました。`;
};

/**
 * 隕石が海に落下したログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 隕石が海に落下したログ
 */
export const logMeteoriteToSea = (island: islandSchemaType, x: number, y: number): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { name } = getMapDefine(mapInfo.type);

  return `${island.island_name}島${coordinate(x, y)}地点の${name}に隕石が落下しました。`;
};

/**
 * 隕石が浅瀬に落下したログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 隕石が浅瀬に落下したログ
 */
export const logMeteoriteToShallows = (island: islandSchemaType, x: number, y: number): string => {
  return `${island.island_name}島${coordinate(x, y)}地点に隕石が落下、海面がえぐられました。。`;
};

/**
 * 隕石が山に落下したログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 隕石が山に落下したログ
 */
export const logMeteoriteToMountain = (island: islandSchemaType, x: number, y: number): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { name } = getMapDefine(mapInfo.type);

  return `${island.island_name}島${coordinate(x, y)}地点の${name}に隕石、${name}は消し飛びました。`;
};

/**
 * 隕石が海底ミサイルに落下したログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 隕石が潜水艦ミサイルに落下したログ
 */
export const logMeteoriteToSubmarineMissile = (
  island: islandSchemaType,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { name } = getMapDefine(mapInfo.type);

  return `${island.island_name}島${coordinate(x, y)}の${name}に隕石が落下、${name}は崩壊しました。`;
};

/**
 * 隕石が怪獣に落下したログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 隕石が怪獣に落下したログ
 */
export const logMeteoriteToMonster = (island: islandSchemaType, x: number, y: number): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { name } = getMapDefine(mapInfo.type);

  return `${island.island_name}島${coordinate(x, y)}の${name}に隕石が落下、陸地は怪獣${name}もろとも水没しました。`;
};

/**
 * 噴火ログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 噴火ログ
 */
export const logEruption = (island: islandSchemaType, x: number, y: number): string => {
  return `${island.island_name}島${coordinate(x, y)}地点で火山が噴火、山が出来ました。`;
};

/**
 * 噴火ダメージログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 噴火ダメージログ
 */
export const logEruptionDamageToShallows = (
  island: islandSchemaType,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { name } = getMapDefine(mapInfo.type);

  return `${island.island_name}島${coordinate(x, y)}地点の${name}は、噴火の影響で陸地になりました。`;
};

/**
 * 噴火ダメージログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 噴火ダメージログ
 */
export const logEruptionDamage = (island: islandSchemaType, x: number, y: number): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { name } = getMapDefine(mapInfo.type);

  return `${island.island_name}島${coordinate(x, y)}地点の${name}は、噴火の影響で壊滅しました。`;
};

/**
 * 海への噴火ダメージログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 海への噴火ダメージログ
 */
export const logEruptionDamageToSea = (island: islandSchemaType, x: number, y: number): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { name } = getMapDefine(mapInfo.type);

  return `${island.island_name}島${coordinate(x, y)}地点の${name}は、噴火の影響で海底が隆起、浅瀬になりました。`;
};
