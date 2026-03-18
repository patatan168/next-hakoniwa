/**
 * @module islandNameChangeCooldown
 * @description 島名変更のクールダウン管理。
 */
const DEFAULT_ISLAND_NAME_CHANGE_COOLDOWN_DAYS = 30;
const SECONDS_PER_DAY = 60 * 60 * 24;

/** 島名変更クールダウンの日数を取得する */
export function getIslandNameChangeCooldownDays() {
  const days = Number(process.env.ISLAND_NAME_CHANGE_COOLDOWN_DAYS ?? '30');
  if (!Number.isFinite(days) || days < 0) {
    return DEFAULT_ISLAND_NAME_CHANGE_COOLDOWN_DAYS;
  }

  return Math.floor(days);
}

/** 島名変更クールダウンの秒数を取得する */
export function getIslandNameChangeCooldownSeconds() {
  return getIslandNameChangeCooldownDays() * SECONDS_PER_DAY;
}
