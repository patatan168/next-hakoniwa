import { changeMapData } from '@/global/function/island';
import { getBaseLog } from '@/global/function/turnProgress';
import { checkProbability } from '@/global/function/utility';
import { islandDataGetSet } from '@/global/store/turnProgress';
import { logOilEarned, logOilEnd } from '../logType';
import { mapType } from '../mapType';
import META_DATA from '../metadata';
import { sea } from './mapLand';

const facilityUnit = '人規模';
export const factory: mapType = {
  type: 'factory',
  baseLand: 'plains',
  name: '工場',
  imgPath: '/img/facility/factory.gif',
  defVal: 1,
  maxVal: 10,
  coefficient: 10000,
  unit: facilityUnit,
};
export const farm: mapType = {
  type: 'farm',
  baseLand: 'plains',
  name: '農場',
  imgPath: '/img/facility/farm.gif',
  defVal: 2,
  maxVal: 50,
  coefficient: 1000,
  unit: facilityUnit,
};
export const mining: mapType = {
  type: 'mining',
  baseLand: 'mountain',
  name: '採掘場',
  imgPath: '/img/facility/mining.gif',
  defVal: 5,
  maxVal: 200,
  coefficient: 100,
  unit: facilityUnit,
};
export const oilField: mapType = {
  type: 'oil_field',
  baseLand: 'oil_field',
  name: '海底油田',
  imgPath: '/img/facility/oil_field.gif',
  defVal: 0,
  maxVal: 0,
  event: function ({ x, y, turn, fromUuid }) {
    using fromIslandGetSet = islandDataGetSet(fromUuid);
    const fromIsland = fromIslandGetSet.islandData;
    if (!fromIsland) throw new Error(`島情報が見つかりません。uuid=${fromUuid}`);

    const baseLog = () => getBaseLog(turn, fromIsland);
    const earningLog = logOilEarned(fromIsland, x, y, META_DATA.OIL_EARN);
    const resultLog = [{ ...baseLog(), log: earningLog, secret_log: earningLog }];
    // 油田収入
    fromIsland.money += META_DATA.OIL_EARN;
    // 油田枯渇判定
    if (checkProbability(META_DATA.OIL_EXHAUSTION_RATE)) {
      const oilEndLog = logOilEnd(fromIsland, x, y);
      changeMapData(fromIsland, x, y, 'sea', { type: 'ins', value: sea.defVal });
      resultLog.push({ ...baseLog(), log: oilEndLog, secret_log: oilEndLog });
    }
    return resultLog;
  },
};
