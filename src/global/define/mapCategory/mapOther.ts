import { changeMapData, mapArrayConverter } from '@/global/function/island';
import { randomIntInRange, valueOrSafeLimit } from '@/global/function/utility';
import { fireDisaster, mapType } from '../mapType';
import META_DATA from '../metadata';

// People
export const people: mapType = {
  type: 'people',
  baseLand: 'plains',
  name: ['村', '町', '都市'],
  imgPath: ['/img/people/village.gif', '/img/people/town.gif', '/img/people/city.gif'],
  defVal: 1,
  maxVal: 200,
  level: [1, 30, 100],
  coefficient: 100,
  unit: '人',
  event: function ({ x, y, turn, fromIsland, eventRate }) {
    const mapInfo = fromIsland.island_info[mapArrayConverter(x, y)];
    // 人口増加
    if (mapInfo.landValue < this.maxVal) {
      const growthValue = () => {
        if (fromIsland.food >= 0) {
          if (mapInfo.landValue > valueOrSafeLimit(this.level?.[0], 'max')) {
            return eventRate.propaganda === 100
              ? META_DATA.PEOPLE_PROPAGANDA.VILLAGE
              : META_DATA.PEOPLE_GROWTH.VILLAGE;
          } else if (mapInfo.landValue > valueOrSafeLimit(this.level?.[1], 'max')) {
            return eventRate.propaganda === 100
              ? META_DATA.PEOPLE_PROPAGANDA.TOWN
              : META_DATA.PEOPLE_GROWTH.TOWN;
          } else if (mapInfo.landValue > valueOrSafeLimit(this.level?.[2], 'max')) {
            return eventRate.propaganda === 100
              ? META_DATA.PEOPLE_PROPAGANDA.CITY
              : META_DATA.PEOPLE_GROWTH.CITY;
          } else {
            return 0;
          }
        } else {
          return META_DATA.PEOPLE_LOSS.FAMINE;
        }
      };
      const tmpValue = mapInfo.landValue + randomIntInRange(1, growthValue());
      if (tmpValue > 0) {
        changeMapData(fromIsland, x, y, 'people', { type: 'ins', value: tmpValue % this.maxVal });
      } else {
        // 人口不足時は平地に戻す
        changeMapData(fromIsland, x, y, 'plains', { type: 'ins', value: 0 });
      }
    }
    // 町以上なら火事判定
    if (mapInfo.landValue > (this.level?.[1] ?? Number.MAX_SAFE_INTEGER)) {
      const log = fireDisaster(x, y, turn, fromIsland, eventRate);
      return log !== undefined ? [log] : undefined;
    }
  },
};

// Monument
export const monument: mapType = {
  type: 'monument',
  baseLand: 'monument',
  name: 'モノリス',
  imgPath: '/img/monument/monument0.gif',
  defVal: 0,
  maxVal: 0,
};
