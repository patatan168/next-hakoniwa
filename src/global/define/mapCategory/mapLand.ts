import { mapType } from '../mapType';

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
  baseLand: 'sea',
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
