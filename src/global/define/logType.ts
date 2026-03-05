import { islandInfo, islandSchemaType } from '@/db/schema/islandTable';
import { userSchemaType } from '@/db/schema/userTable';
import { mapArrayConverter } from '../function/island';
import { people } from './mapCategory/mapOther';
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
  const char = isSecret ? '(?, ?)' : `(${x}, ${y})`;
  return `[c]${char}[/c]`;
};

const islandName = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  link = true
) => {
  if (link) {
    return `[ui:${island.uuid}]${island.island_name}島[/ui]`;
  }
  return `[i]${island.island_name}島[/i]`;
};

const planName = (plan: planType | string) => {
  const name = typeof plan === 'string' ? plan : plan.name;
  return `[p]${name}[/p]`;
};

const disaster = (char: string) => {
  return `[d]${char}[/d]`;
};

const mapName = (info: islandInfo) => {
  const name = getMapName(info.type, info.landValue, getMapDefine(info.type).name);
  return `[b]${name}[/b]`;
};

/**
 * コストが十分でない場合のログ
 * @param island 島情報
 * @param plan 計画情報
 * @returns ログ
 */
export const logLackCosts = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  plan: planType
): string => {
  const lackCost = plan.costType === 'money' ? '資金' : '備蓄食料';
  return `${islandName(island)}で予定されていた${planName(plan)}は、${lackCost}不足のため中止されました。`;
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
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  plan: planType,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  return `${islandName(island)}で予定されていた${planName(plan)}は、予定地の${coordinate(x, y)}が${mapName(mapInfo)}だったため中止されました。`;
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
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  plan: planType,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  return `${islandName(island)}で予定されていた${planName(plan)}は、予定地の${coordinate(x, y)}の${mapName(mapInfo)}の周辺に陸地が無かったため中止されました。`;
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
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  plan: planType,
  x: number,
  y: number,
  isSecret = false
): string => {
  return `${islandName(island)}${coordinate(x, y, isSecret)}で${planName(plan)}が行われました。`;
};

/**
 * 座標の無い共通の開発ログ
 * @param island 島情報
 * @param plan 計画情報
 * @returns ログ
 */
export const logNoCoordinateCommonDev = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  plan: planType
): string => {
  return `${islandName(island)}で${planName(plan)}が行われました。`;
};

/**
 * 共通の援助ログ
 * @param fromIsland 援助元
 * @param toIsland 援助先
 * @param plan 計画情報
 * @param times 実行回数
 * @returns ログ
 */
export const logCommonAid = (
  fromIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  toIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  plan: planType,
  times: number
): string => {
  const unit = plan.costType === 'money' ? META_DATA.UNIT_MONEY : META_DATA.UNIT_FOOD;
  const cost = plan.cost * times;
  return `${islandName(fromIsland)}が${islandName(toIsland)}へ[b]${cost}${unit}[/b]の${planName(plan)}を行いました。`;
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
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  plan: planType,
  x: number,
  y: number,
  times: number,
  isSecret = false
): string => {
  const timesLog = times > 1 ? `${times}回、` : '';
  return `${islandName(island)}${coordinate(x, y, isSecret)}で${planName(plan)}が${timesLog}行われました。`;
};

/**
 * 森の開発ログ
 * @param island 島情報
 * @returns ログ
 */
export const logForest = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>
): string => {
  return `こころなしか、${islandName(island)}の森が増えたようです。`;
};

/**
 * 水没のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns ログ
 */
export const logSubmersion = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const { baseLand } = getMapDefine(mapInfo.type);
  const seaType = ['sea', 'submarine_missile', 'oil_field'];
  const submersionLog = seaType.includes(baseLand) ? '跡形もなくなりました。' : '水没しました。';

  return `${islandName(island)}${coordinate(x, y)}の${mapName(mapInfo)}は${submersionLog}`;
};

/**
 * 怪獣水没のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns ログ
 */
export const logMonsterSubmersion = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  return `${islandName(island)}${coordinate(x, y)}の陸地は${mapName(mapInfo)}もろとも水没しました。`;
};

/**
 * 荒地化のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns ログ
 */
export const logDamageWaste = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  return `${islandName(island)}${coordinate(x, y)}の${mapName(mapInfo)}は一瞬にして荒地と化しました。`;
};

/**
 * 怪獣が消し飛ぶログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns ログ
 */
export const logScatterMonster = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  return `${islandName(island)}${coordinate(x, y)}の${mapName(mapInfo)}は消し飛びました。`;
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
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  plan: planType,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  return `${islandName(island)}${coordinate(x, y)}で${mapName(mapInfo)}の自爆装置がセットされました。`;
};

/**
 * 自爆のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns ログ
 */
export const logSelfCrash = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  return `${islandName(island)}${coordinate(x, y)}の${mapName(mapInfo)}、${disaster('自爆装置作動！！')}`;
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
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number,
  earn: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  return `${islandName(island)}${coordinate(x, y)}の${mapName(mapInfo)}から、${earn}${META_DATA.UNIT_MONEY}の収益が上がりました。`;
};

/**
 * 石油枯渇のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns ログ
 */
export const logOilEnd = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  return `${islandName(island)}${coordinate(x, y)}の${mapName(mapInfo)}は枯渇したようです。`;
};

/**
 * 火災のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns ログ
 */
export const logFire = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number
): string => {
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  return `${islandName(island)}${coordinate(x, y)}の${mapName(mapInfo)}が${disaster('火災')}により壊滅しました。`;
};

/**
 * 台風のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns ログ
 */
export const logTyphoon = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>
): string => {
  return `${islandName(island)}に${disaster('台風')}上陸！！`;
};

/**
 * 台風のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns ログ
 */
export const logTyphoonDamage = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number
): string => {
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  return `${islandName(island)}${coordinate(x, y)}の${mapName(mapInfo)}は${disaster('台風')}台風で飛ばされました。`;
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
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number,
  moveX: number,
  moveY: number
): string => {
  // 移動元の地形を取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const name = getMapName(mapInfo.type, mapInfo.landValue, getMapDefine(mapInfo.type).name);

  // 移動先の地形を取得
  const moveMapInfo = island.island_info[mapArrayConverter(moveX, moveY)];
  const { name: moveName } = getMapDefine(moveMapInfo.type);

  return `${islandName(island)}${coordinate(moveX, moveY)}の${moveName}が[b]怪獣${name}[/b]に踏み荒らされました。`;
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
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number,
  moveX: number,
  moveY: number
): string => {
  // 移動元の地形を取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  // 移動先の地形を取得
  const moveMapInfo = island.island_info[mapArrayConverter(moveX, moveY)];
  const { name: moveName } = getMapDefine(moveMapInfo.type);

  return `怪獣${mapName(mapInfo)}が${islandName(island)}${coordinate(moveX, moveY)}へ到達、${moveName}の${disaster('自爆装置が発動！！')}`;
};

/**
 * 地震のログ
 * @param island 島情報
 * @returns ログ
 */
export const logEarthquake = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>
): string => {
  return `${islandName(island)}で大規模な${disaster('地震')}が発生！！`;
};

/**
 * 地震による被害のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns ログ
 */
export const logEarthquakeDamage = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  return `${islandName(island)}${coordinate(x, y)}の${mapName(mapInfo)}は${disaster('地震')}により壊滅しました。`;
};

/**
 * 食糧不足のログ
 * @param island 島情報
 * @returns ログ
 */
export const logLackFoods = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>
): string => {
  return `${islandName(island)}の${disaster('食料が不足')}しています！！`;
};

/**
 * 食糧不足による被害のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns ログ
 */
export const logLackFoodsDamage = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  return `${islandName(island)}${coordinate(x, y)}の${mapName(mapInfo)}に[b]食料を求めて住民が殺到[/b]。${mapName(mapInfo)}は壊滅しました。`;
};

/**
 * 津波のログ
 * @param island 島情報
 * @returns ログ
 */
export const logTsunami = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>
): string => {
  return `${islandName(island)}付近で${disaster('津波')}が発生！！`;
};

/**
 * 津波による被害のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 津波による被害のログ
 */
export const logTsunamiDamage = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  return `${islandName(island)}${coordinate(x, y)}の${mapName(mapInfo)}は${disaster('津波')}により崩壊しました。`;
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
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  popMonsterType: mapType,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  const monsterName = popMonsterType.name;
  return `${islandName(island)}${coordinate(x, y)}に[b]怪獣${monsterName}[/b]が出現！！${coordinate(x, y)}の${mapName(mapInfo)}が踏み荒らされました。`;
};

/**
 * 地盤沈下のログ
 * @param island 島情報
 * @returns 地盤沈下のログ
 */
export const logLandSubsidence = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>
): string => {
  return `${islandName(island)}で地盤沈下が発生しました！！`;
};

/**
 * 地盤沈下による被害のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 地盤沈下による被害のログ
 */
export const logLandSubsidenceDamage = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  return `${islandName(island)}${coordinate(x, y)}の${mapName(mapInfo)}は海の中へ沈みました。`;
};

/**
 * 記念碑落下のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 記念碑落下のログ
 */
export const logFallMonument = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number
): string => {
  return `何かとてつもないものが${islandName(island)}${coordinate(x, y)}地点に落下しました！！。`;
};

/**
 * 隕石落下のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 隕石落下のログ
 */
export const logMeteorite = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  return `${islandName(island)}${coordinate(x, y)}地点の${mapName(mapInfo)}に${disaster('隕石')}が落下、一帯が水没しました。`;
};

/**
 * 巨大隕石落下のログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 巨大隕石落下のログ
 */
export const logHugeMeteorite = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number
): string => {
  return `${islandName(island)}${coordinate(x, y)}地点に${disaster('巨大隕石')}が落下！！`;
};

/**
 * 隕石が海に落下したログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 隕石が海に落下したログ
 */
export const logMeteoriteToSea = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  return `${islandName(island)}${coordinate(x, y)}地点の${mapName(mapInfo)}に${disaster('隕石')}が落下しました。`;
};

/**
 * 隕石が浅瀬に落下したログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 隕石が浅瀬に落下したログ
 */
export const logMeteoriteToShallows = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number
): string => {
  return `${islandName(island)}${coordinate(x, y)}地点に${disaster('隕石')}が落下、海面がえぐられました。`;
};

/**
 * 隕石が山に落下したログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 隕石が山に落下したログ
 */
export const logMeteoriteToMountain = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  return `${islandName(island)}${coordinate(x, y)}地点の${mapName(mapInfo)}に${disaster('隕石')}、${mapName(mapInfo)}は消し飛びました。`;
};

/**
 * 隕石が海底ミサイルに落下したログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 隕石が潜水艦ミサイルに落下したログ
 */
export const logMeteoriteToSubmarineMissile = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  return `${islandName(island)}${coordinate(x, y)}の${mapName(mapInfo)}に${disaster('隕石')}が落下、${mapName(mapInfo)}は崩壊しました。`;
};

/**
 * 隕石が怪獣に落下したログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 隕石が怪獣に落下したログ
 */
export const logMeteoriteToMonster = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  return `${islandName(island)}${coordinate(x, y)}の${mapName(mapInfo)}に${disaster('隕石が')}落下、陸地は[b]怪獣${name}[/b]もろとも水没しました。`;
};

/**
 * 噴火ログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 噴火ログ
 */
export const logEruption = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number
): string => {
  return `${islandName(island)}${coordinate(x, y)}地点${disaster('で火山が噴火')}、[b]山[/b]が出来ました。`;
};

/**
 * 噴火ダメージログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 噴火ダメージログ
 */
export const logEruptionDamageToShallows = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  return `${islandName(island)}${coordinate(x, y)}地点の${mapName(mapInfo)}は、${disaster('噴火')}の影響で陸地になりました。`;
};

/**
 * 噴火ダメージログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 噴火ダメージログ
 */
export const logEruptionDamage = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  return `${islandName(island)}${coordinate(x, y)}地点の${mapName(mapInfo)}は、${disaster('噴火')}の影響で壊滅しました。`;
};

/**
 * 海への噴火ダメージログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @returns 海への噴火ダメージログ
 */
export const logEruptionDamageToSea = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];

  return `${islandName(island)}${coordinate(x, y)}地点の${mapName(mapInfo)}は、${disaster('噴火')}の影響で海底が隆起、浅瀬になりました。`;
};

/**
 * 埋蔵金発見ログ
 * @param island 島情報
 * @param x X座標
 * @param y Y座標
 * @param earn 発見した埋蔵金
 * @returns 埋蔵金発見ログ
 */
export const logTreasure = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  x: number,
  y: number,
  earn: number
): string => {
  // マップ情報の取得
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  const name = getMapName(mapInfo.type, mapInfo.landValue, getMapDefine(mapInfo.type).name);

  return `${islandName(island)}${coordinate(x, y)}での${name}中に、[b]${earn}${META_DATA.UNIT_MONEY}[/b]もの埋蔵金が発見されました。`;
};

/**
 * 島滅亡ログ
 * @param island 島情報
 * @returns 島滅亡ログ
 */
export const logIslandDeath = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>
): string => {
  return `${islandName(island, false)}から人がいなくなり、[b]無人島[/b]になりました。`;
};

/**
 * 島削除ログ
 * @param island 島情報
 * @returns 島削除ログ
 */
export const logIslandDelete = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>
): string => {
  return `${islandName(island, false)}は放棄され、[b]無人島[/b]になりました。`;
};

/**
 * 資源輸出ログ
 * @param fromIsland 資源を輸出する島
 * @param plan 計画
 * @param cost 資源のコスト
 * @param earn 獲得した資源
 * @returns 資源輸出ログ
 */
export const logResourceExport = (
  fromIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  plan: planType,
  cost: number,
  earn: { unit: string; amount: number }
): string => {
  const unit = plan.unit === 'money' ? META_DATA.UNIT_MONEY : META_DATA.UNIT_FOOD;
  return `${islandName(fromIsland)}が[b]${cost}${unit}[/b]の${planName(plan)}を行い[b]${earn.amount}${earn.unit}[/b]を得ました。`;
};

/**
 * ミサイル発射計画が実行されたが、目標の島が存在しなかった場合のログ
 * @param island 計画を実行した島情報
 * @param planNameStr 計画の名称
 * @returns ログ文字列
 */
export const logMissileNoTarget = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  planNameStr: string
): string => {
  return `${islandName(island)}で予定されていた${planName(planNameStr)}は、目標の島が存在しないため中止されました。`;
};

/**
 * ミサイル発射計画が実行されたが、島内に発射可能な基地が存在しなかった場合のログ
 * @param island 計画を実行した島情報
 * @param planNameStr 計画の名称
 * @returns ログ文字列
 */
export const logMissileNoBase = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  planNameStr: string
): string => {
  return `${islandName(island)}で予定されていた${planName(planNameStr)}は、発射可能な基地が無かったため中止されました。`;
};

/**
 * ステルスミサイルが範囲外（海など）に着弾した場合のログ（対象島不明用）
 * @returns ログ文字列
 */
export const logMissileOutS = (): string => {
  return `どこからかミサイルが発射されました。`;
};

/**
 * 通常のミサイルが範囲外（海など）に着弾した場合のログ
 * @param fromIsland 発射元の島情報
 * @param toIsland 発射先の島情報
 * @param planNameStr 計画の名称
 * @returns ログ文字列
 */
export const logMissileOut = (
  fromIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  toIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  planNameStr: string
): string => {
  return `${islandName(fromIsland)}から${islandName(toIsland)}に向けて${planName(planNameStr)}が行われました。しかし着弾点は範囲外でした。`;
};

/**
 * ステルスミサイルが防衛施設等によって迎撃された場合のログ
 * @param toIsland 着弾目標だった島情報
 * @param ix 迎撃されたX座標
 * @param iy 迎撃されたY座標
 * @returns ログ文字列
 */
export const logMissileCaughtS = (
  toIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  ix: number,
  iy: number
): string => {
  return `どこからかミサイルが発射され、${islandName(toIsland)}${coordinate(ix, iy)}上空で爆破されました。`;
};

/**
 * 通常のミサイルが防衛施設等によって迎撃された場合のログ
 * @param fromIsland 発射元の島情報
 * @param toIsland 着弾目標の島情報
 * @param planNameStr 計画の名称
 * @param tx 目標のX座標
 * @param ty 目標のY座標
 * @param ix 迎撃されたX座標
 * @param iy 迎撃されたY座標
 * @returns ログ文字列
 */
export const logMissileCaught = (
  fromIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  toIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  planNameStr: string,
  tx: number,
  ty: number,
  ix: number,
  iy: number
): string => {
  return `${islandName(fromIsland)}から${islandName(toIsland)}の${coordinate(tx, ty)}に向けて${planName(planNameStr)}が行われました。しかし${coordinate(ix, iy)}上空にて防衛施設により爆破されました。`;
};

/**
 * ステルスミサイルが浅瀬などに着弾し、被害がなかった場合のログ
 * @param toIsland 着弾した島情報
 * @param ix 着弾X座標
 * @param iy 着弾Y座標
 * @param fakeMapInfo 偽装マップ情報
 * @returns ログ文字列
 */
export const logMissileNoDamageS = (
  toIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  ix: number,
  iy: number,
  fakeMapInfo: islandInfo
): string => {
  return `どこからかミサイルが発射され、${islandName(toIsland)}の${coordinate(ix, iy)}の${mapName(fakeMapInfo)}に着弾しましたが効果はありませんでした。`;
};

/**
 * 通常のミサイルが浅瀬などに着弾し、被害がなかった場合のログ
 * @param fromIsland 発射元の島情報
 * @param toIsland 着弾した島情報
 * @param planNameStr 計画の名称
 * @param tx 目標のX座標
 * @param ty 目標のY座標
 * @param ix 着弾X座標
 * @param iy 着弾Y座標
 * @param fakeMapInfo 偽装マップ情報
 * @returns ログ文字列
 */
export const logMissileNoDamage = (
  fromIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  toIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  planNameStr: string,
  tx: number,
  ty: number,
  ix: number,
  iy: number,
  fakeMapInfo: islandInfo
): string => {
  return `${islandName(fromIsland)}から${islandName(toIsland)}の${coordinate(tx, ty)}に向けて${planName(planNameStr)}が行われ、${coordinate(ix, iy)}の${mapName(fakeMapInfo)}に着弾しましたが効果はありませんでした。`;
};

/**
 * ステルスミサイルが荒地に着弾し、被害を与えられなかった場合のログ
 * @param toIsland 着弾した島情報
 * @param ix 着弾X座標
 * @param iy 着弾Y座標
 * @param fakeMapInfo 偽装マップ情報
 * @returns ログ文字列
 */
export const logMissileWasteS = (
  toIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  ix: number,
  iy: number,
  fakeMapInfo: islandInfo
): string => {
  return `どこからかミサイルが発射され、${islandName(toIsland)}の${coordinate(ix, iy)}の${mapName(fakeMapInfo)}に着弾しましたが被害はありませんでした。`;
};

/**
 * 通常のミサイルが荒地に着弾し、被害を与えられなかった場合のログ
 * @param fromIsland 発射元の島情報
 * @param toIsland 着弾した島情報
 * @param planNameStr 計画の名称
 * @param tx 目標のX座標
 * @param ty 目標のY座標
 * @param ix 着弾X座標
 * @param iy 着弾Y座標
 * @param fakeMapInfo 偽装マップ情報
 * @returns ログ文字列
 */
export const logMissileWaste = (
  fromIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  toIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  planNameStr: string,
  tx: number,
  ty: number,
  ix: number,
  iy: number,
  fakeMapInfo: islandInfo
): string => {
  return `${islandName(fromIsland)}から${islandName(toIsland)}の${coordinate(tx, ty)}に向けて${planName(planNameStr)}が行われ、${coordinate(ix, iy)}の${mapName(fakeMapInfo)}に着弾しましたが被害はありませんでした。`;
};

/**
 * ステルスミサイルが怪獣に着弾し、ダメージを与えられなかった場合のログ
 * @param toIsland 着弾した島情報
 * @param ix 着弾X座標
 * @param iy 着弾Y座標
 * @param fakeMapInfo 偽装マップ情報
 * @returns ログ文字列
 */
export const logMissileMonNoDamageS = (
  toIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  ix: number,
  iy: number,
  fakeMapInfo: islandInfo
): string => {
  return `どこからかミサイルが発射され、${islandName(toIsland)}の${coordinate(ix, iy)}の怪獣${mapName(fakeMapInfo)}に着弾しましたが、外殻で弾かれました。`;
};

/**
 * 通常のミサイルが怪獣に着弾し、ダメージを与えられなかった場合のログ
 * @param fromIsland 発射元の島情報
 * @param toIsland 着弾した島情報
 * @param planNameStr 計画の名称
 * @param tx 目標のX座標
 * @param ty 目標のY座標
 * @param ix 着弾X座標
 * @param iy 着弾Y座標
 * @param fakeMapInfo 偽装マップ情報
 * @returns ログ文字列
 */
export const logMissileMonNoDamage = (
  fromIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  toIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  planNameStr: string,
  tx: number,
  ty: number,
  ix: number,
  iy: number,
  fakeMapInfo: islandInfo
): string => {
  return `${islandName(fromIsland)}から${islandName(toIsland)}の${coordinate(tx, ty)}に向けて${planName(planNameStr)}が行われ、${coordinate(ix, iy)}の怪獣${mapName(fakeMapInfo)}に着弾しましたが、外殻で弾かれました。`;
};

/**
 * ステルスミサイルが怪獣に着弾し、討伐に成功した場合のログ
 * @param toIsland 着弾した島情報
 * @param ix 着弾X座標
 * @param iy 着弾Y座標
 * @param fakeMapInfo 偽装マップ情報
 * @returns ログ文字列
 */
export const logMissileMonKillS = (
  toIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  ix: number,
  iy: number,
  fakeMapInfo: islandInfo
): string => {
  return `どこからかミサイルが発射され、${islandName(toIsland)}の${coordinate(ix, iy)}の怪獣${mapName(fakeMapInfo)}に着弾、見事しとめました。`;
};

/**
 * 通常のミサイルが怪獣に着弾し、討伐に成功した場合のログ
 * @param fromIsland 発射元の島情報
 * @param toIsland 着弾した島情報
 * @param planNameStr 計画の名称
 * @param tx 目標のX座標
 * @param ty 目標のY座標
 * @param ix 着弾X座標
 * @param iy 着弾Y座標
 * @param fakeMapInfo 偽装マップ情報
 * @returns ログ文字列
 */
export const logMissileMonKill = (
  fromIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  toIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  planNameStr: string,
  tx: number,
  ty: number,
  ix: number,
  iy: number,
  fakeMapInfo: islandInfo
): string => {
  return `${islandName(fromIsland)}から${islandName(toIsland)}の${coordinate(tx, ty)}に向けて${planName(planNameStr)}が行われ、${coordinate(ix, iy)}の怪獣${mapName(fakeMapInfo)}に着弾、見事しとめました。`;
};

/**
 * 怪獣を討伐して賞金を獲得した場合のログ（共通）
 * @param fakeMapInfo 偽装マップ情報
 * @param money 獲得賞金額
 * @returns ログ文字列
 */
export const logMissileMonMoney = (fakeMapInfo: islandInfo, money: number): string => {
  return `怪獣${mapName(fakeMapInfo)}の死体は、標本として${money}${META_DATA.UNIT_MONEY}にて買い取られました。`;
};

/**
 * ステルスミサイルが怪獣に着弾し、ダメージを与えた場合のログ
 * @param toIsland 着弾した島情報
 * @param ix 着弾X座標
 * @param iy 着弾Y座標
 * @param fakeMapInfo 偽装マップ情報
 * @returns ログ文字列
 */
export const logMissileMonsterS = (
  toIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  ix: number,
  iy: number,
  fakeMapInfo: islandInfo
): string => {
  return `どこからかミサイルが発射され、${islandName(toIsland)}の${coordinate(ix, iy)}の怪獣${mapName(fakeMapInfo)}に着弾、ダメージを与えました。`;
};

/**
 * 通常のミサイルが怪獣に着弾し、ダメージを与えた場合のログ
 * @param fromIsland 発射元の島情報
 * @param toIsland 着弾した島情報
 * @param planNameStr 計画の名称
 * @param tx 目標のX座標
 * @param ty 目標のY座標
 * @param ix 着弾X座標
 * @param iy 着弾Y座標
 * @param fakeMapInfo 偽装マップ情報
 * @returns ログ文字列
 */
export const logMissileMonster = (
  fromIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  toIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  planNameStr: string,
  tx: number,
  ty: number,
  ix: number,
  iy: number,
  fakeMapInfo: islandInfo
): string => {
  return `${islandName(fromIsland)}から${islandName(toIsland)}の${coordinate(tx, ty)}に向けて${planName(planNameStr)}が行われ、${coordinate(ix, iy)}の怪獣${mapName(fakeMapInfo)}に着弾、ダメージを与えました。`;
};

/**
 * ステルスミサイルが通常の地形（平地、町、森など）に着弾し、荒地化させた場合のログ
 * @param toIsland 着弾した島情報
 * @param ix 着弾X座標
 * @param iy 着弾Y座標
 * @param fakeMapInfo 偽装マップ情報
 * @returns ログ文字列
 */
export const logMissileNormalS = (
  toIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  ix: number,
  iy: number,
  fakeMapInfo: islandInfo
): string => {
  return `どこからかミサイルが発射され、${islandName(toIsland)}の${coordinate(ix, iy)}の${mapName(fakeMapInfo)}に着弾しました。`;
};

/**
 * 通常のミサイルが通常の地形（平地、町、森など）に着弾し、荒地化させた場合のログ
 * @param fromIsland 発射元の島情報
 * @param toIsland 着弾した島情報
 * @param planNameStr 計画の名称
 * @param tx 目標のX座標
 * @param ty 目標のY座標
 * @param ix 着弾X座標
 * @param iy 着弾Y座標
 * @param fakeMapInfo 偽装マップ情報
 * @returns ログ文字列
 */
export const logMissileNormal = (
  fromIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  toIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  planNameStr: string,
  tx: number,
  ty: number,
  ix: number,
  iy: number,
  fakeMapInfo: islandInfo
): string => {
  return `${islandName(fromIsland)}から${islandName(toIsland)}の${coordinate(tx, ty)}に向けて${planName(planNameStr)}が行われ、${coordinate(ix, iy)}の${mapName(fakeMapInfo)}に着弾しました。`;
};

/**
 * 陸地破壊爆弾（LDミサイル）が山に着弾し、山を荒地にした場合のログ
 * @param fromIsland 発射元の島情報
 * @param toIsland 着弾した島情報
 * @param planNameStr 計画の名称
 * @param tx 目標のX座標
 * @param ty 目標のY座標
 * @param ix 着弾X座標
 * @param iy 着弾Y座標
 * @param fakeMapInfo 偽装マップ情報
 * @returns ログ文字列
 */
export const logMissileLDMountain = (
  fromIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  toIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  planNameStr: string,
  tx: number,
  ty: number,
  ix: number,
  iy: number,
  fakeMapInfo: islandInfo
): string => {
  return `${islandName(fromIsland)}から${islandName(toIsland)}の${coordinate(tx, ty)}に向けて${planName(planNameStr)}が行われ、${coordinate(ix, iy)}の${mapName(fakeMapInfo)}は見事に崩壊し荒地になりました。`;
};

/**
 * 陸地破壊爆弾（LDミサイル）が海底基地に着弾し、浅瀬化（破壊）した場合のログ
 * @param fromIsland 発射元の島情報
 * @param toIsland 着弾した島情報
 * @param planNameStr 計画の名称
 * @param tx 目標のX座標
 * @param ty 目標のY座標
 * @param ix 着弾X座標
 * @param iy 着弾Y座標
 * @returns ログ文字列
 */
export const logMissileLDSbase = (
  fromIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  toIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  planNameStr: string,
  tx: number,
  ty: number,
  ix: number,
  iy: number
): string => {
  return `${islandName(fromIsland)}から${islandName(toIsland)}の${coordinate(tx, ty)}に向けて${planName(planNameStr)}が行われ、${coordinate(ix, iy)}に着弾、衝撃で海底が隆起し浅瀬になりました。`;
};

/**
 * 陸地破壊爆弾（LDミサイル）が怪獣に着弾し、怪獣を地形と一緒に海底へ沈めた場合のログ
 * @param fromIsland 発射元の島情報
 * @param toIsland 着弾した島情報
 * @param planNameStr 計画の名称
 * @param tx 目標のX座標
 * @param ty 目標のY座標
 * @param ix 着弾X座標
 * @param iy 着弾Y座標
 * @param fakeMapInfo 偽装マップ情報
 * @returns ログ文字列
 */
export const logMissileLDMonster = (
  fromIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  toIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  planNameStr: string,
  tx: number,
  ty: number,
  ix: number,
  iy: number,
  fakeMapInfo: islandInfo
): string => {
  return `${islandName(fromIsland)}から${islandName(toIsland)}の${coordinate(tx, ty)}に向けて${planName(planNameStr)}が行われ、${coordinate(ix, iy)}の怪獣${mapName(fakeMapInfo)}に着弾、衝撃で陸地ごと海底へ沈みました。`;
};

/**
 * 陸地破壊爆弾（LDミサイル）が浅瀬に着弾し、完全に海にした場合のログ
 * @param fromIsland 発射元の島情報
 * @param toIsland 着弾した島情報
 * @param planNameStr 計画の名称
 * @param tx 目標のX座標
 * @param ty 目標のY座標
 * @param ix 着弾X座標
 * @param iy 着弾Y座標
 * @returns ログ文字列
 */
export const logMissileLDSea1 = (
  fromIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  toIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  planNameStr: string,
  tx: number,
  ty: number,
  ix: number,
  iy: number
): string => {
  return `${islandName(fromIsland)}から${islandName(toIsland)}の${coordinate(tx, ty)}に向けて${planName(planNameStr)}が行われ、${coordinate(ix, iy)}に着弾、衝撃で浅瀬はえぐられ完全に海になりました。`;
};

/**
 * 陸地破壊爆弾（LDミサイル）が陸地（平地・森・町・基地など）に着弾し、浅瀬化した場合のログ
 * @param fromIsland 発射元の島情報
 * @param toIsland 着弾した島情報
 * @param planNameStr 計画の名称
 * @param tx 目標のX座標
 * @param ty 目標のY座標
 * @param ix 着弾X座標
 * @param iy 着弾Y座標
 * @returns ログ文字列
 */
export const logMissileLDLand = (
  fromIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  toIsland: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  planNameStr: string,
  tx: number,
  ty: number,
  ix: number,
  iy: number
): string => {
  return `${islandName(fromIsland)}から${islandName(toIsland)}の${coordinate(tx, ty)}に向けて${planName(planNameStr)}が行われ、${coordinate(ix, iy)}に着弾、衝撃で陸地がえぐられ浅瀬になりました。`;
};

/**
 * ミサイル着弾による難民が発生し、他島（または自島内）へ漂着した場合のログ
 * @param island 難民を受け入れた島情報
 * @param achieve 到着した難民の数
 * @returns ログ文字列
 */
export const logMissileBoatPeople = (
  island: islandSchemaType & Pick<userSchemaType, 'island_name'>,
  achieve: number
): string => {
  const coefficient = people.coefficient ?? 1;
  return `難民船が${islandName(island)}に到着しました。（${coefficient * achieve}人）`;
};

/**
 * ターン処理結果（非公開ログ）
 * @param moneySign 資金の増減符号
 * @param diffMoney 資金の変動量
 * @param foodSign 食料の増減符号
 * @param diffFood 食料の変動量
 * @param popSign 人口の増減符号
 * @param diffPopulation 人口の変動量
 * @returns ターン処理結果のログ
 */
export const logTurnResult = (
  moneySign: string,
  diffMoney: number,
  foodSign: string,
  diffFood: number,
  popSign: string,
  diffPopulation: number
): string => {
  return `[b](収支)[/b]人口: ${popSign}${diffPopulation}人、資金: ${moneySign}${diffMoney}${META_DATA.UNIT_MONEY}、食糧: ${foodSign}${diffFood}${META_DATA.UNIT_FOOD}`;
};
