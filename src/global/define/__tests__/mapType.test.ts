import { describe, expect, test } from 'vitest';
import * as mapFacility from '../mapCategory/mapFacility';
import * as mapFake from '../mapCategory/mapFake';
import * as mapLand from '../mapCategory/mapLand';
import * as mapMilitary from '../mapCategory/mapMilitary';
import * as mapMonster from '../mapCategory/mapMonster';
import * as mapOther from '../mapCategory/mapOther';
import * as MapType from '../mapType';

describe('getMapDefine', () => {
  test('undefined => dummy', () => {
    expect(MapType.getMapDefine('test')).toEqual(mapFake.dummy);
  });
  describe('monster', () => {
    test('inora', () => {
      expect(MapType.getMapDefine('inora')).toEqual(mapMonster.inora);
    });
    test('inora_ghost', () => {
      expect(MapType.getMapDefine('inora_ghost')).toEqual(mapMonster.inoraGhost);
    });
    test('meka_inora', () => {
      expect(MapType.getMapDefine('meka_inora')).toEqual(mapMonster.mekaInora);
    });
    test('dark_inora', () => {
      expect(MapType.getMapDefine('dark_inora')).toEqual(mapMonster.darkInora);
    });
    test('red_inora', () => {
      expect(MapType.getMapDefine('red_inora')).toEqual(mapMonster.redInora);
    });
    test('king_inora', () => {
      expect(MapType.getMapDefine('king_inora')).toEqual(mapMonster.kingInora);
    });
    test('sanjira', () => {
      expect(MapType.getMapDefine('sanjira')).toEqual(mapMonster.sanjira);
    });
    test('kujira', () => {
      expect(MapType.getMapDefine('kujira')).toEqual(mapMonster.kujira);
    });
  });
  describe('land', () => {
    test('forest', () => {
      expect(MapType.getMapDefine('forest')).toEqual(mapLand.forest);
    });
    test('plains', () => {
      expect(MapType.getMapDefine('plains')).toEqual(mapLand.plains);
    });
    test('ruins', () => {
      expect(MapType.getMapDefine('ruins')).toEqual(mapLand.ruins);
    });
    test('sea', () => {
      expect(MapType.getMapDefine('sea')).toEqual(mapLand.sea);
    });
    test('shallows', () => {
      expect(MapType.getMapDefine('shallows')).toEqual(mapLand.shallows);
    });
    test('mountain', () => {
      expect(MapType.getMapDefine('mountain')).toEqual(mapLand.mountain);
    });
    test('wasteland', () => {
      expect(MapType.getMapDefine('wasteland')).toEqual(mapLand.wasteland);
    });
  });
  describe('military', () => {
    test('missile', () => {
      expect(MapType.getMapDefine('missile')).toEqual(mapMilitary.missile);
    });
    test('submarine_missile', () => {
      expect(MapType.getMapDefine('submarine_missile')).toEqual(mapMilitary.submarineMissile);
    });
    test('defense_base', () => {
      expect(MapType.getMapDefine('defense_base')).toEqual(mapMilitary.defenseBase);
    });
    test('fake_defense_base', () => {
      expect(MapType.getMapDefine('fake_defense_base')).toEqual(mapMilitary.fakeDefenseBase);
    });
  });
  describe('facility', () => {
    test('factory', () => {
      expect(MapType.getMapDefine('factory')).toEqual(mapFacility.factory);
    });
    test('farm', () => {
      expect(MapType.getMapDefine('farm')).toEqual(mapFacility.farm);
    });
    test('mining', () => {
      expect(MapType.getMapDefine('mining')).toEqual(mapFacility.mining);
    });
    test('oil_field', () => {
      expect(MapType.getMapDefine('oil_field')).toEqual(mapFacility.oilField);
    });
  });
  test('monument', () => {
    expect(MapType.getMapDefine('monument')).toEqual(mapOther.monument);
  });
  test('people', () => {
    expect(MapType.getMapDefine('people')).toEqual(mapOther.people);
  });
});

describe('getMapLevel', () => {
  describe('missile', () => {
    test('level1', () => {
      expect(MapType.getMapLevel('missile', 0)).toBe(1);
    });
    test('level2', () => {
      expect(MapType.getMapLevel('missile', 20)).toBe(2);
    });
    test('level3', () => {
      expect(MapType.getMapLevel('missile', 60)).toBe(3);
    });
    test('level4', () => {
      expect(MapType.getMapLevel('missile', 120)).toBe(4);
    });
    test('level5', () => {
      expect(MapType.getMapLevel('missile', 200)).toBe(5);
    });
  });
  describe('submarine_missile', () => {
    test('level1', () => {
      expect(MapType.getMapLevel('submarine_missile', 0)).toBe(1);
    });
    test('level2', () => {
      expect(MapType.getMapLevel('submarine_missile', 50)).toBe(2);
    });
    test('level3', () => {
      expect(MapType.getMapLevel('submarine_missile', 200)).toBe(3);
    });
  });
});
