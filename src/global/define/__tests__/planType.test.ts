import { describe, expect, test } from 'vitest';
import * as planConstruction from '../planCategory/planConstruction';
import * as planDevelopment from '../planCategory/planDevelopment';
import * as planManage from '../planCategory/planManege';
import * as PlanType from '../planType';

describe('getPlanDefine', () => {
  test('undefined => financing', () => {
    expect(PlanType.getPlanDefine('test')).toEqual(planManage.financing);
  });
  describe('construction', () => {
    test('afforest', () => {
      expect(PlanType.getPlanDefine('afforest')).toEqual(planConstruction.afforest);
    });
    test('immediate_afforest', () => {
      expect(PlanType.getPlanDefine('immediate_afforest')).toEqual(
        planConstruction.immediateAfforest
      );
    });
    test('defense_base_dev', () => {
      expect(PlanType.getPlanDefine('defense_base_dev')).toEqual(planConstruction.defenseBaseDev);
    });
    test('immediate_defense_base_dev', () => {
      expect(PlanType.getPlanDefine('immediate_defense_base_dev')).toEqual(
        planConstruction.immediateDefenseBaseDev
      );
    });
    test('farm_dev', () => {
      expect(PlanType.getPlanDefine('farm_dev')).toEqual(planConstruction.farmDev);
    });
    test('immediate_farm_dev', () => {
      expect(PlanType.getPlanDefine('immediate_farm_dev')).toEqual(
        planConstruction.immediateFarmDev
      );
    });
    test('mining_dev', () => {
      expect(PlanType.getPlanDefine('mining_dev')).toEqual(planConstruction.miningDev);
    });
    test('immediate_mining_dev', () => {
      expect(PlanType.getPlanDefine('immediate_mining_dev')).toEqual(
        planConstruction.immediateMiningDev
      );
    });
    test('missile_dev', () => {
      expect(PlanType.getPlanDefine('missile_dev')).toEqual(planConstruction.missileDev);
    });
    test('immediate_missile_dev', () => {
      expect(PlanType.getPlanDefine('immediate_missile_dev')).toEqual(
        planConstruction.immediateMissileDev
      );
    });
    test('submarine_missile_dev', () => {
      expect(PlanType.getPlanDefine('submarine_missile_dev')).toEqual(
        planConstruction.submarineMissileDev
      );
    });
  });
  describe('development', () => {
    test('drilling', () => {
      expect(PlanType.getPlanDefine('drilling')).toEqual(planDevelopment.drilling);
    });
    test('immediate_drilling', () => {
      expect(PlanType.getPlanDefine('immediate_drilling')).toEqual(
        planDevelopment.immediateDrilling
      );
    });
    test('landfill', () => {
      expect(PlanType.getPlanDefine('landfill')).toEqual(planDevelopment.landfill);
    });
    test('immediate_landfill', () => {
      expect(PlanType.getPlanDefine('immediate_landfill')).toEqual(
        planDevelopment.immediateLandfill
      );
    });
    test('leveling', () => {
      expect(PlanType.getPlanDefine('leveling')).toEqual(planDevelopment.leveling);
    });
    test('immediate_leveling', () => {
      expect(PlanType.getPlanDefine('immediate_leveling')).toEqual(
        planDevelopment.immediateLeveling
      );
    });
    test('logging', () => {
      expect(PlanType.getPlanDefine('logging')).toEqual(planDevelopment.logging);
    });
    test('immediate_logging', () => {
      expect(PlanType.getPlanDefine('immediate_logging')).toEqual(planDevelopment.immediateLogging);
    });
  });
});
