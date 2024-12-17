import { describe, expect, test } from 'vitest';
import * as MapType from '../mapType';

describe('getMapDefine', () => {
  test('undefined => dummy', () => {
    expect(MapType.getMapDefine('test')).toBe(MapType.dummy);
  });
  describe('monster', () => {
    test('inora', () => {
      expect(MapType.getMapDefine('inora')).toBe(MapType.inora);
    });
    test('inora_ghost', () => {
      expect(MapType.getMapDefine('inora_ghost')).toBe(MapType.inoraGhost);
    });
    test('meka_inora', () => {
      expect(MapType.getMapDefine('meka_inora')).toBe(MapType.mekaInora);
    });
    test('dark_inora', () => {
      expect(MapType.getMapDefine('dark_inora')).toBe(MapType.darkInora);
    });
    test('red_inora', () => {
      expect(MapType.getMapDefine('red_inora')).toBe(MapType.redInora);
    });
    test('king_inora', () => {
      expect(MapType.getMapDefine('king_inora')).toBe(MapType.kingInora);
    });
    test('sanjira', () => {
      expect(MapType.getMapDefine('sanjira')).toBe(MapType.sanjira);
    });
    test('kujira', () => {
      expect(MapType.getMapDefine('kujira')).toBe(MapType.kujira);
    });
  });
  describe('land', () => {
    test('forest', () => {
      expect(MapType.getMapDefine('forest')).toBe(MapType.forest);
    });
    test('plains', () => {
      expect(MapType.getMapDefine('plains')).toBe(MapType.plains);
    });
    test('ruins', () => {
      expect(MapType.getMapDefine('ruins')).toBe(MapType.ruins);
    });
    test('sea', () => {
      expect(MapType.getMapDefine('sea')).toBe(MapType.sea);
    });
    test('shallows', () => {
      expect(MapType.getMapDefine('shallows')).toBe(MapType.shallows);
    });
    test('mountain', () => {
      expect(MapType.getMapDefine('mountain')).toBe(MapType.mountain);
    });
    test('wasteland', () => {
      expect(MapType.getMapDefine('wasteland')).toBe(MapType.wasteland);
    });
  });
  describe('military', () => {
    test('missile', () => {
      expect(MapType.getMapDefine('missile')).toBe(MapType.missile);
    });
    test('submarine_missile', () => {
      expect(MapType.getMapDefine('submarine_missile')).toBe(MapType.submarineMissile);
    });
    test('defense_base', () => {
      expect(MapType.getMapDefine('defense_base')).toBe(MapType.defenseBase);
    });
    test('fake_defense_base', () => {
      expect(MapType.getMapDefine('fake_defense_base')).toBe(MapType.fakeDefenseBase);
    });
  });
  describe('facility', () => {
    test('factory', () => {
      expect(MapType.getMapDefine('factory')).toBe(MapType.factory);
    });
    test('farm', () => {
      expect(MapType.getMapDefine('farm')).toBe(MapType.farm);
    });
    test('mining', () => {
      expect(MapType.getMapDefine('mining')).toBe(MapType.mining);
    });
    test('oil_field', () => {
      expect(MapType.getMapDefine('oil_field')).toBe(MapType.oilField);
    });
  });
  test('monument', () => {
    expect(MapType.getMapDefine('monument')).toBe(MapType.monument);
  });
  test('people', () => {
    expect(MapType.getMapDefine('people')).toBe(MapType.people);
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
