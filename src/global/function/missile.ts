import { islandInfo, islandSchemaType } from '@/db/schema/islandTable';
import { turnLogSchemaType } from '@/db/schema/turnLogTable';
import { userSchemaType } from '@/db/schema/userTable';
import {
  logMissileBoatPeople,
  logMissileCaught,
  logMissileCaughtS,
  logMissileLDLand,
  logMissileLDMonster,
  logMissileLDMountain,
  logMissileLDSbase,
  logMissileLDSea1,
  logMissileMonKill,
  logMissileMonKillS,
  logMissileMonMoney,
  logMissileMonNoDamage,
  logMissileMonNoDamageS,
  logMissileMonster,
  logMissileMonsterS,
  logMissileNoBase,
  logMissileNoDamage,
  logMissileNoDamageS,
  logMissileNoTarget,
  logMissileNormal,
  logMissileNormalS,
  logMissileOut,
  logMissileOutS,
  logMissileWaste,
  logMissileWasteS,
} from '../define/logType';
import { getMapDefine, getMapLevel } from '../define/mapType';
import META_DATA from '../define/metadata';
import {
  changeMapData,
  countMapAround,
  getMapAround,
  isOpenSea,
  mapArrayConverter,
} from './island';
import { getBaseLog } from './turnProgress';
import { randomIntInRange } from './utility';

type IslandWithUser = islandSchemaType & Pick<userSchemaType, 'island_name'>;

/**
 * 発射元の島から対象の島へミサイルを撃ち込むメイン処理
 * 各種ミサイル（通常、PP、ST、LD）の分岐や難民処理を統括
 * @param turn 現在のターン数
 * @param fromIsland 発射元の島情報
 * @param toIsland 発射先の島情報
 * @param targetX 目標X座標
 * @param targetY 目標Y座標
 * @param missileType ミサイルの種類
 * @param times ミサイルの発射回数（0の場合は資金と弾が尽きるまで）
 * @param planName 計画の名称（ログ用）
 * @param cost ミサイル1発あたりの費用
 * @returns 発生したすべてのログ配列
 */
export const executeMissile = ({
  turn,
  fromIsland,
  toIsland,
  targetX,
  targetY,
  missileType,
  times,
  planName,
  cost,
}: {
  turn: number;
  fromIsland: IslandWithUser;
  toIsland: IslandWithUser | undefined;
  targetX: number;
  targetY: number;
  missileType: 'normal' | 'pp' | 'st' | 'ld';
  times: number;
  planName: string;
  cost: number;
}): turnLogSchemaType[] => {
  if (!toIsland) {
    const log = logMissileNoTarget(fromIsland, planName);
    return [{ ...getBaseLog(turn, fromIsland), secret_log: log, log }];
  }

  const missileBases = findMissileBases(fromIsland);
  if (missileBases.length === 0) {
    const log = logMissileNoBase(fromIsland, planName);
    return [{ ...getBaseLog(turn, fromIsland), secret_log: log, log }];
  }

  return processMissileImpacts({
    turn,
    fromIsland,
    toIsland,
    targetX,
    targetY,
    missileType,
    times,
    planName,
    cost,
    missileBases,
  });
};

/**
 * 島のマップを走査し、ミサイル発射可能な基地と経験値（レベル）の一覧を取得
 * @param fromIsland 走査対象の島情報
 * @returns 基地の座標とレベルの配列
 */
const findMissileBases = (fromIsland: IslandWithUser) => {
  const missileBases = [];
  for (let x = 0; x < META_DATA.MAP_SIZE; x++) {
    for (let y = 0; y < META_DATA.MAP_SIZE; y++) {
      const mapInfo = fromIsland.island_info[mapArrayConverter(x, y)];
      if (mapInfo.type === 'missile' || mapInfo.type === 'submarine_missile') {
        missileBases.push({ x, y, level: getMapLevel(mapInfo.type, mapInfo.landValue) });
      }
    }
  }
  return missileBases;
};

/**
 * 複数基地からのミサイル連続発射処理
 * 発射ごとのお金消費、着弾処理の呼び出し、難民の集計を行う
 * @param args 発射に必要なパラメータ群
 * @returns 発生したすべてのログ配列
 */
const processMissileImpacts = ({
  turn,
  fromIsland,
  toIsland,
  targetX,
  targetY,
  missileType,
  times,
  planName,
  cost,
  missileBases,
}: {
  turn: number;
  fromIsland: IslandWithUser;
  toIsland: IslandWithUser;
  targetX: number;
  targetY: number;
  missileType: 'normal' | 'pp' | 'st' | 'ld';
  times: number;
  planName: string;
  cost: number;
  missileBases: { x: number; y: number; level: number }[];
}) => {
  // 0の場合は資金と弾が尽きるまで撃ち続けるため、事実上の無限回数を設定する
  let remainingTimes = times === 0 ? Number.MAX_SAFE_INTEGER : times;
  const logs: turnLogSchemaType[] = [];
  let accumulatedRefugees = 0;
  let flagShot = false;

  // PP（ピンポイント）ミサイルは高精度なため、通常のミサイルより着弾誤差を狭める
  const errorHex = missileType === 'pp' ? 1 : 2;

  for (const base of missileBases) {
    // 基地のレベルは経験値付与によって変動するため、ループのたびに現在のレベルを取得する
    let getBaseLevel = () => {
      const mapInfo = fromIsland.island_info[mapArrayConverter(base.x, base.y)];
      return getMapLevel(mapInfo.type, mapInfo.landValue);
    };

    let baseLevel = getBaseLevel();
    // 撃つたびにレベル（発射可能弾数）を1ずつ消費して計算する
    // ただし、途中で経験値を得てレベルが上がった場合は発射可能回数が増える
    let usedLevel = 0;

    while (baseLevel - usedLevel > 0 && remainingTimes > 0 && fromIsland.money >= cost) {
      usedLevel++;
      remainingTimes--;
      fromIsland.money -= cost;
      flagShot = true;

      const area = getMapAround(targetX, targetY, errorHex);
      const impactPoint = area[randomIntInRange(0, area.length - 1)];

      const impactResult = processSingleImpact({
        turn,
        fromIsland,
        toIsland,
        targetX,
        targetY,
        impactPoint,
        missileType,
        planName,
        base,
      });

      logs.push(...impactResult.logs);
      accumulatedRefugees += impactResult.refugees;

      // 発射によって経験値が得られた場合、基地レベルが上限まで変動する可能性があるため再取得
      baseLevel = getBaseLevel();
    }
  }

  if (
    flagShot &&
    accumulatedRefugees > 0 &&
    fromIsland.uuid !== toIsland.uuid &&
    missileType !== 'st'
  ) {
    // 発生した難民のうち、海上を生き延びて無事に他島へ漂着できるのは半数のみとする仕様
    const validRefugees = Math.floor(accumulatedRefugees / 2);
    const refugeeLogs = processRefugees(fromIsland, turn, validRefugees);
    if (refugeeLogs) logs.push(refugeeLogs);
  }

  return logs;
};

/**
 * ステルスミサイルと通常ミサイルでログの出力を分けるヘルパー関数
 * ステルスなら公開用と、発射元のみ見られる非公開用の2つのログを追加する
 */
const createMissileLogs = (
  isStealth: boolean,
  turn: number,
  fromIsland: IslandWithUser,
  baseLog: ReturnType<typeof getBaseLog>,
  stealthLogText: string,
  normalLogText: string
): turnLogSchemaType[] => {
  if (isStealth) {
    return [
      {
        ...baseLog,
        from_uuid: baseLog.to_uuid ?? '',
        secret_log: stealthLogText,
        log: stealthLogText,
      },
      { ...getBaseLog(turn, fromIsland), secret_log: normalLogText, log: null },
    ];
  }
  return [{ ...baseLog, secret_log: normalLogText, log: normalLogText }];
};

/**
 * ミサイル1発ごとの着弾処理
 * 迎撃判定や弾かれ判定を行い、ミサイル種別に応じた被害計算へ分岐
 * @param args 1発の着弾に必要なパラメータ群
 * @returns 発生したログと発生した難民数のオブジェクト
 */
const processSingleImpact = ({
  turn,
  fromIsland,
  toIsland,
  targetX,
  targetY,
  impactPoint,
  missileType,
  planName,
  base,
}: {
  turn: number;
  fromIsland: IslandWithUser;
  toIsland: IslandWithUser;
  targetX: number;
  targetY: number;
  impactPoint: { x: number; y: number };
  missileType: 'normal' | 'pp' | 'st' | 'ld';
  planName: string;
  base: { x: number; y: number; level: number };
}): { logs: turnLogSchemaType[]; refugees: number } => {
  const isStealth = missileType === 'st';
  const baseLog = getBaseLog(turn, fromIsland, toIsland);

  if (isOpenSea(impactPoint.x, impactPoint.y)) {
    const logOutS = logMissileOutS();
    const logOut = logMissileOut(fromIsland, toIsland, planName);
    return {
      logs: createMissileLogs(isStealth, turn, fromIsland, baseLog, logOutS, logOut),
      refugees: 0,
    };
  }

  const impactMapInfo = toIsland.island_info[mapArrayConverter(impactPoint.x, impactPoint.y)];

  if (checkIntercepted(toIsland, impactPoint.x, impactPoint.y, impactMapInfo.type)) {
    const logCaughtS = logMissileCaughtS(toIsland, impactPoint.x, impactPoint.y);
    const logCaught = logMissileCaught(
      fromIsland,
      toIsland,
      planName,
      targetX,
      targetY,
      impactPoint.x,
      impactPoint.y
    );
    return {
      logs: createMissileLogs(isStealth, turn, fromIsland, baseLog, logCaughtS, logCaught),
      refugees: 0,
    };
  }

  if (checkNoDamage(missileType, impactMapInfo.type)) {
    // 潜水艦基地は攻撃を弾いた際、単なる「海」としてログに記録し、他島からその存在を秘匿する
    const fakeMapInfo =
      impactMapInfo.type === 'submarine_missile'
        ? { ...impactMapInfo, type: 'sea' }
        : impactMapInfo;
    const logNoDamS = logMissileNoDamageS(toIsland, impactPoint.x, impactPoint.y, fakeMapInfo);
    const logNoDam = logMissileNoDamage(
      fromIsland,
      toIsland,
      planName,
      targetX,
      targetY,
      impactPoint.x,
      impactPoint.y,
      fakeMapInfo
    );
    return {
      logs: createMissileLogs(isStealth, turn, fromIsland, baseLog, logNoDamS, logNoDam),
      refugees: 0,
    };
  }

  if (missileType === 'ld') {
    return applyLandDestructionMissile({
      turn,
      fromIsland,
      toIsland,
      targetX,
      targetY,
      impactPoint,
      planName,
      impactMapInfo,
      base,
    });
  } else {
    return applyNormalMissile({
      turn,
      fromIsland,
      toIsland,
      targetX,
      targetY,
      impactPoint,
      planName,
      impactMapInfo,
      missileType,
      base,
    });
  }
};

/**
 * 対象座標が防衛施設等により迎撃されるかどうかの判定
 * @param island 対象の島情報
 * @param ix 目標X座標
 * @param iy 目標Y座標
 * @param type 着弾地点の地形タイプ
 * @returns 迎撃判定結果（真偽値）
 */
const checkIntercepted = (island: IslandWithUser, ix: number, iy: number, type: string) => {
  if (type === 'defense_base') return false; // 直撃の場合は迎撃されないで破壊される
  const defenseBaseCount = countMapAround(island.island_info, 'defense_base', ix, iy, 2);
  return defenseBaseCount > 0;
};

/**
 * ミサイル種別と地形種別による「被害なし（弾かれた）」判定
 * @param missileType ミサイルの種類
 * @param type 着弾地点の地形タイプ
 * @returns 被害なし判定結果（真偽値）
 */
const checkNoDamage = (missileType: string, type: string) => {
  return (
    type === 'sea' ||
    (missileType !== 'ld' &&
      (type === 'shallows' || type === 'submarine_missile' || type === 'mountain'))
  );
};

/**
 * 陸地破壊爆弾（LDミサイル）専用の地形破壊処理
 * 陸地をえぐったり海底を隆起させたりする
 * @param args 陸地破壊爆弾の着弾に必要なパラメータ群
 * @returns 発生したログと難民数（常に0）
 */
const applyLandDestructionMissile = ({
  turn,
  fromIsland,
  toIsland,
  targetX,
  targetY,
  impactPoint,
  planName,
  impactMapInfo,
  base,
}: {
  turn: number;
  fromIsland: IslandWithUser;
  toIsland: IslandWithUser;
  targetX: number;
  targetY: number;
  impactPoint: { x: number; y: number };
  planName: string;
  impactMapInfo: islandInfo;
  base: { x: number; y: number };
}) => {
  const baseLog = getBaseLog(turn, fromIsland, toIsland);
  let log = '';
  const impactBaseLand = getMapDefine(impactMapInfo.type).baseLand;

  if (impactMapInfo.type === 'mountain') {
    log = logMissileLDMountain(
      fromIsland,
      toIsland,
      planName,
      targetX,
      targetY,
      impactPoint.x,
      impactPoint.y,
      impactMapInfo
    );
    changeMapData(toIsland, impactPoint.x, impactPoint.y, 'ruins', { type: 'ins', value: 0 });
  } else if (impactMapInfo.type === 'marine_base') {
    log = logMissileLDSbase(
      fromIsland,
      toIsland,
      planName,
      targetX,
      targetY,
      impactPoint.x,
      impactPoint.y
    );
    changeMapData(toIsland, impactPoint.x, impactPoint.y, 'shallows', { type: 'ins', value: 0 });
  } else if (['monster', 'sanjira', 'kujira'].includes(impactBaseLand)) {
    log = logMissileLDMonster(
      fromIsland,
      toIsland,
      planName,
      targetX,
      targetY,
      impactPoint.x,
      impactPoint.y,
      impactMapInfo
    );
    changeMapData(toIsland, impactPoint.x, impactPoint.y, 'shallows', { type: 'ins', value: 0 });
  } else if (impactMapInfo.type === 'shallows') {
    log = logMissileLDSea1(
      fromIsland,
      toIsland,
      planName,
      targetX,
      targetY,
      impactPoint.x,
      impactPoint.y
    );
    changeMapData(toIsland, impactPoint.x, impactPoint.y, 'sea', { type: 'ins', value: 0 });
  } else {
    log = logMissileLDLand(
      fromIsland,
      toIsland,
      planName,
      targetX,
      targetY,
      impactPoint.x,
      impactPoint.y
    );
    changeMapData(toIsland, impactPoint.x, impactPoint.y, 'shallows', { type: 'ins', value: 0 });
  }

  if (impactMapInfo.type === 'people') {
    grantBaseExperience(fromIsland, base.x, base.y, impactMapInfo.landValue);
  }

  if (['oil_field', 'sea', 'submarine_missile'].includes(impactMapInfo.type)) {
    changeMapData(toIsland, impactPoint.x, impactPoint.y, 'sea', { type: 'ins', value: 0 });
  }

  return { logs: [{ ...baseLog, secret_log: log, log }], refugees: 0 };
};

/**
 * 通常ミサイル系統（通常、PP、ST）の着弾被害処理
 * 怪獣への命中や地形の荒地化を行う
 * @param args 通常ミサイル系の着弾に必要なパラメータ群
 * @returns 発生したログと発生した難民数のオブジェクト
 */
const applyNormalMissile = ({
  turn,
  fromIsland,
  toIsland,
  targetX,
  targetY,
  impactPoint,
  planName,
  impactMapInfo,
  missileType,
  base,
}: {
  turn: number;
  fromIsland: IslandWithUser;
  toIsland: IslandWithUser;
  targetX: number;
  targetY: number;
  impactPoint: { x: number; y: number };
  planName: string;
  impactMapInfo: islandInfo;
  missileType: 'normal' | 'pp' | 'st';
  base: { x: number; y: number };
}) => {
  const isStealth = missileType === 'st';
  const baseLog = getBaseLog(turn, fromIsland, toIsland);
  const impactBaseLand = getMapDefine(impactMapInfo.type).baseLand;
  let refugees = 0;
  const logs: turnLogSchemaType[] = [];

  if (impactMapInfo.type === 'wasteland') {
    changeMapData(toIsland, impactPoint.x, impactPoint.y, 'ruins', { type: 'ins', value: 0 });
    const logWasteS = logMissileWasteS(toIsland, impactPoint.x, impactPoint.y, impactMapInfo);
    const logWaste = logMissileWaste(
      fromIsland,
      toIsland,
      planName,
      targetX,
      targetY,
      impactPoint.x,
      impactPoint.y,
      impactMapInfo
    );
    logs.push(...createMissileLogs(isStealth, turn, fromIsland, baseLog, logWasteS, logWaste));
  } else if (['monster', 'sanjira', 'kujira'].includes(impactBaseLand)) {
    handleMonsterImpact(
      fromIsland,
      toIsland,
      turn,
      planName,
      targetX,
      targetY,
      impactPoint,
      impactMapInfo,
      isStealth,
      baseLog,
      logs,
      base
    );
  } else {
    const logNormS = logMissileNormalS(toIsland, impactPoint.x, impactPoint.y, impactMapInfo);
    const logNorm = logMissileNormal(
      fromIsland,
      toIsland,
      planName,
      targetX,
      targetY,
      impactPoint.x,
      impactPoint.y,
      impactMapInfo
    );
    logs.push(...createMissileLogs(isStealth, turn, fromIsland, baseLog, logNormS, logNorm));

    if (impactMapInfo.type === 'people') {
      grantBaseExperience(fromIsland, base.x, base.y, impactMapInfo.landValue);
      refugees = impactMapInfo.landValue;
    }

    changeMapData(toIsland, impactPoint.x, impactPoint.y, 'ruins', { type: 'ins', value: 0 });
    if (impactMapInfo.type === 'oil_field') {
      changeMapData(toIsland, impactPoint.x, impactPoint.y, 'sea', { type: 'ins', value: 0 });
    }
  }

  return { logs, refugees };
};

/**
 * ミサイルが怪獣に命中した際の専用処理
 * 怪獣の硬化判定、討伐、および賞金・経験値の付与を行う
 * @param fromIsland 発射元の島情報
 * @param toIsland 発射先の島情報
 * @param turn 現在のターン数
 * @param planName 計画の名称
 * @param targetX 目標X座標
 * @param targetY 目標Y座標
 * @param impactPoint 実際の着弾座標
 * @param impactMapInfo 着弾地点の地形情報
 * @param isStealth ステルスミサイルかどうかのフラグ
 * @param baseLog 共通のベースログ
 * @param logs 追加先のログ配列
 * @param base 発射した基地の座標
 */
const handleMonsterImpact = (
  fromIsland: IslandWithUser,
  toIsland: IslandWithUser,
  turn: number,
  planName: string,
  targetX: number,
  targetY: number,
  impactPoint: { x: number; y: number },
  impactMapInfo: islandInfo,
  isStealth: boolean,
  baseLog: ReturnType<typeof getBaseLog>,
  logs: turnLogSchemaType[],
  base: { x: number; y: number }
) => {
  // サンジラは奇数ターン、クジラは偶数ターンに硬化状態となり、あらゆるミサイルのダメージを無効化する
  const isHardened =
    (impactMapInfo.type === 'sanjira' && turn % 2 !== 0) ||
    (impactMapInfo.type === 'kujira' && turn % 2 === 0);

  if (isHardened) {
    const logMonNoDamS = logMissileMonNoDamageS(
      toIsland,
      impactPoint.x,
      impactPoint.y,
      impactMapInfo
    );
    const logMonNoDam = logMissileMonNoDamage(
      fromIsland,
      toIsland,
      planName,
      targetX,
      targetY,
      impactPoint.x,
      impactPoint.y,
      impactMapInfo
    );
    logs.push(
      ...createMissileLogs(isStealth, turn, fromIsland, baseLog, logMonNoDamS, logMonNoDam)
    );
    return;
  }

  // 現在の体力が1以下（今回の着弾で0になる）場合、討伐成功として処理する
  if (impactMapInfo.landValue <= 1) {
    const logKillS = logMissileMonKillS(toIsland, impactPoint.x, impactPoint.y, impactMapInfo);
    const logKill = logMissileMonKill(
      fromIsland,
      toIsland,
      planName,
      targetX,
      targetY,
      impactPoint.x,
      impactPoint.y,
      impactMapInfo
    );
    logs.push(...createMissileLogs(isStealth, turn, fromIsland, baseLog, logKillS, logKill));
    changeMapData(toIsland, impactPoint.x, impactPoint.y, 'ruins', { type: 'ins', value: 0 });

    const { exp, bounty } = getMapDefine(impactMapInfo.type);
    grantBaseExperience(fromIsland, base.x, base.y, (exp ?? 0) * 20);

    if (bounty && bounty > 0) {
      toIsland.money += bounty;
      const mLog = logMissileMonMoney(impactMapInfo, bounty);
      logs.push({ ...baseLog, secret_log: mLog, log: mLog });
    }
  } else {
    const logMonS = logMissileMonsterS(toIsland, impactPoint.x, impactPoint.y, impactMapInfo);
    const logMon = logMissileMonster(
      fromIsland,
      toIsland,
      planName,
      targetX,
      targetY,
      impactPoint.x,
      impactPoint.y,
      impactMapInfo
    );
    logs.push(...createMissileLogs(isStealth, turn, fromIsland, baseLog, logMonS, logMon));
    changeMapData(toIsland, impactPoint.x, impactPoint.y, impactMapInfo.type, {
      type: 'sub',
      value: 1,
    });
  }
};

/**
 * モンスター等によって難民が発生した際の他島への難民漂着処理
 * @param fromIsland 漂着元の島情報
 * @param turn 現在のターン数
 * @param validRefugees 実際に漂着する難民の数
 * @returns 発生した難民漂着ログ（ログがない場合はundefined）
 */
const processRefugees = (fromIsland: IslandWithUser, turn: number, validRefugees: number) => {
  if (validRefugees <= 0) return undefined;
  let refugeesToDistribute = validRefugees;
  let distributed = 0;

  for (let x = 0; x < META_DATA.MAP_SIZE && refugeesToDistribute > 0; x++) {
    for (let y = 0; y < META_DATA.MAP_SIZE && refugeesToDistribute > 0; y++) {
      const mapInfo = fromIsland.island_info[mapArrayConverter(x, y)];
      if (mapInfo.type === 'people') {
        const add = Math.min(refugeesToDistribute, 50);
        changeMapData(fromIsland, x, y, 'people', { type: 'add', value: add });
        const newMapInfo = fromIsland.island_info[mapArrayConverter(x, y)];
        if (newMapInfo.landValue > 200) {
          const over = newMapInfo.landValue - 200;
          changeMapData(fromIsland, x, y, 'people', { type: 'ins', value: 200 });
          refugeesToDistribute -= add - over;
          distributed += add - over;
        } else {
          refugeesToDistribute -= add;
          distributed += add;
        }
      } else if (mapInfo.type === 'plains') {
        changeMapData(fromIsland, x, y, 'people', { type: 'ins', value: 0 });
        const add = Math.min(refugeesToDistribute, 10);
        changeMapData(fromIsland, x, y, 'people', { type: 'add', value: add > 5 ? 5 : add - 5 });
        distributed += add;
        refugeesToDistribute -= add;
      }
    }
  }

  if (distributed > 0) {
    const log = logMissileBoatPeople(fromIsland, distributed);
    return { ...getBaseLog(turn, fromIsland), secret_log: log, log: null };
  }
  return undefined;
};

/**
 * ミサイル発射によって対象に被害を与えた際、基地に経験値を付与する処理
 * @param island 発射元の島情報
 * @param x 基地のX座標
 * @param y 基地のY座標
 * @param enemyLandValue 攻撃対象の元々の規模（人口や怪獣の体力など）
 */
const grantBaseExperience = (
  island: islandSchemaType,
  x: number,
  y: number,
  enemyLandValue: number
) => {
  const mapInfo = island.island_info[mapArrayConverter(x, y)];
  if (mapInfo.type === 'missile' || mapInfo.type === 'submarine_missile') {
    // 基地の経験値は標的の規模（人口、怪獣の体力など）の1/20（切り捨て）だけ上昇する
    const expGain = Math.floor(enemyLandValue / 20);
    // 経験値の最大値は200に制限されている
    const newExp = Math.min(mapInfo.landValue + expGain, 200);
    changeMapData(island, x, y, mapInfo.type, { type: 'ins', value: newExp });
  }
};
