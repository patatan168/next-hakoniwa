import { describe, expect, it } from 'vitest';
import { getNextLoginBonusModalState } from './useDevelopmentPage';

describe('getNextLoginBonusModalState', () => {
  it('opens the modal when a new login bonus is received', () => {
    const loginBonus = {
      consecutive_login_days: 2,
      money: 3000,
      food: 100,
    };

    const state = getNextLoginBonusModalState({
      loginBonus,
      pendingLoginBonus: null,
      isLoginBonusClosed: false,
      lastProcessedLoginBonus: null,
    });

    expect(state.shouldUpdate).toBe(true);
    expect(state.pendingLoginBonus).toEqual(loginBonus);
    expect(state.isLoginBonusClosed).toBe(false);
  });

  it('keeps the modal closed when the bonus payload disappears after the user closes it', () => {
    const state = getNextLoginBonusModalState({
      loginBonus: null,
      pendingLoginBonus: null,
      isLoginBonusClosed: true,
      lastProcessedLoginBonus: {
        consecutive_login_days: 2,
        money: 3000,
        food: 100,
      },
    });

    expect(state.shouldUpdate).toBe(false);
    expect(state.pendingLoginBonus).toBeNull();
    expect(state.isLoginBonusClosed).toBe(true);
  });
});
