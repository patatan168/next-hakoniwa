import { mapType } from '../mapType';

// People
export const people: mapType = {
  type: 'people',
  baseLand: 'plains',
  name: ['村', '街', '都市'],
  imgPath: ['/img/people/village.gif', '/img/people/town.gif', '/img/people/city.gif'],
  defVal: 1,
  maxVal: 200,
  level: [1, 30, 100],
  coefficient: 100,
  unit: '人',
};

// Monument
export const monument: mapType = {
  type: 'monument',
  baseLand: 'plains',
  name: 'モノリス',
  imgPath: '/img/monument/monument0.gif',
  defVal: 0,
  maxVal: 0,
};
