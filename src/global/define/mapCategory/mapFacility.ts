import { changeMapData } from '@/global/function/island';
import { getBaseLog } from '@/global/function/turnProgress';
import { checkProbability } from '@/global/function/utility';
import { logOilEarned, logOilEnd } from '../logType';
import { mapType } from '../mapType';
import META_DATA from '../metadata';
import { sea } from './mapLand';

export const factory: mapType = {
  type: 'factory',
  baseLand: 'plains',
  name: '工場',
  imgPath: '/img/facility/factory.gif',
  defVal: 0,
  maxVal: 100,
  coefficient: 100,
  unit: '00人',
  unitType: 'after',
};
export const mining: mapType = {
  type: 'mining',
  baseLand: 'mountain',
  name: '採掘場',
  imgPath: '/img/facility/mining.gif',
  defVal: 0,
  maxVal: 100,
  coefficient: 100,
  unit: '00人',
  unitType: 'after',
};
export const farm: mapType = {
  type: 'farm',
  baseLand: 'plains',
  name: '農場',
  imgPath: '/img/facility/farm.gif',
  defVal: 0,
  maxVal: 100,
  coefficient: 100,
  unit: '00人',
  unitType: 'after',
};
export const submarineMissile: mapType = {
  type: 'submarine_missile',
  baseLand: 'submarine_missile',
  name: '海底基地',
  imgPath: '/img/facility/submarine_missile.gif',
  defVal: 0,
  maxVal: 0,
};
export const oilField: mapType = {
  type: 'oil_field',
  baseLand: 'oil_field',
  name: '油田',
  imgPath: '/img/facility/oil_field.gif',
  defVal: 0,
  maxVal: 0,
  event: function ({ x, y, turn, fromUuid: _fromUuid, island }) {
    const baseLog = () => getBaseLog(turn, island);
    const earningLog = logOilEarned(island, x, y, META_DATA.OIL_EARN);
    const resultLog = [{ ...baseLog(), log: earningLog, secret_log: earningLog }];
    // 油田収入
    island.money += META_DATA.OIL_EARN;
    // 油田枯渇判定
    if (checkProbability(META_DATA.OIL_EXHAUSTION_RATE)) {
      const oilEndLog = logOilEnd(island, x, y);
      changeMapData(island, x, y, 'sea', { type: 'ins', value: sea.defVal });
      resultLog.push({ ...baseLog(), log: oilEndLog, secret_log: oilEndLog });
    }
    return resultLog;
  },
};
