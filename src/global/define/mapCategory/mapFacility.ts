import { mapType } from '../mapType';

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
};
