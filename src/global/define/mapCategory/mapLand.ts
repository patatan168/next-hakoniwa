import { changeMapData, countMapAround, mapArrayConverter } from '@/global/function/island';
import { checkProbability } from '@/global/function/utility';
import { islandDataGetSet } from '@/global/store/turnProgress';
import { mapType } from '../mapType';
import META_DATA from '../metadata';
import { people } from './mapOther';

export const forest: mapType = {
  type: 'forest',
  fakeType: 'fake_forest',
  baseLand: 'plains',
  name: '森',
  imgPath: '/img/land/forest.gif',
  defVal: 5,
  maxVal: 200,
  coefficient: 100,
  unit: '本',
  event: function ({ x, y, fromUuid }) {
    using fromIslandGetSet = islandDataGetSet(fromUuid);
    const fromIsland = fromIslandGetSet.islandData;
    if (!fromIsland) throw new Error(`島情報が見つかりません。uuid=${fromUuid}`);

    const mapInfo = fromIsland.island_info[mapArrayConverter(x, y)];
    // 森林増加
    if (mapInfo.landValue < this.maxVal) {
      changeMapData(fromIsland, x, y, this.type, { type: 'add', value: 1 });
    }
  },
};
export const mountain: mapType = {
  type: 'mountain',
  baseLand: 'mountain',
  name: '山',
  imgPath: '/img/land/mountain.gif',
  defVal: 0,
  maxVal: 0,
};
export const plains: mapType = {
  type: 'plains',
  baseLand: 'plains',
  name: '平地',
  imgPath: '/img/land/plains.gif',
  defVal: 0,
  maxVal: 0,
  event: function ({ x, y, fromUuid }) {
    using fromIslandGetSet = islandDataGetSet(fromUuid);
    const fromIsland = fromIslandGetSet.islandData;
    if (!fromIsland) throw new Error(`島情報が見つかりません。uuid=${fromUuid}`);

    // 平地に村ができる
    if (checkProbability(META_DATA.VILLAGE_APPEARANCE_RATE)) {
      const peopleNum = countMapAround(fromIsland.island_info, 'people', x, y, 1);
      const farmNum = countMapAround(fromIsland.island_info, 'farm', x, y, 1);
      if (peopleNum > 0 || farmNum > 0) {
        changeMapData(fromIsland, x, y, 'people', { type: 'ins', value: people.defVal });
      }
    }
  },
};
export const ruins: mapType = {
  type: 'ruins',
  baseLand: 'plains',
  name: '荒地',
  imgPath: '/img/land/ruins.gif',
  defVal: 0,
  maxVal: 0,
};
export const sea: mapType = {
  type: 'sea',
  baseLand: 'sea',
  name: '海',
  imgPath: '/img/land/sea.gif',
  defVal: 0,
  maxVal: 0,
};
export const shallows: mapType = {
  type: 'shallows',
  baseLand: 'shallows',
  name: '浅瀬',
  imgPath: '/img/land/shallows.gif',
  defVal: 0,
  maxVal: 0,
};
export const wasteland: mapType = {
  type: 'wasteland',
  baseLand: 'plains',
  name: '荒地',
  imgPath: '/img/land/wasteland.gif',
  defVal: 0,
  maxVal: 0,
};
