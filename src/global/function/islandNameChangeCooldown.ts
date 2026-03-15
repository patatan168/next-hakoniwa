const DEFAULT_ISLAND_NAME_CHANGE_COOLDOWN_DAYS = 30;
const SECONDS_PER_DAY = 60 * 60 * 24;

export function getIslandNameChangeCooldownDays() {
  const days = Number(process.env.ISLAND_NAME_CHANGE_COOLDOWN_DAYS ?? '30');
  if (!Number.isFinite(days) || days < 0) {
    return DEFAULT_ISLAND_NAME_CHANGE_COOLDOWN_DAYS;
  }

  return Math.floor(days);
}

export function getIslandNameChangeCooldownSeconds() {
  return getIslandNameChangeCooldownDays() * SECONDS_PER_DAY;
}
