/**
 * @module moderatorRole
 * @description 管理者ロールの定義と名前解決。
 */

export const MODERATOR_ROLE = Object.freeze({
  admin: 0,
  moderator: 1,
} as const);

export type ModeratorRole = (typeof MODERATOR_ROLE)[keyof typeof MODERATOR_ROLE];

const ROLE_NAME_MAP: Record<ModeratorRole, string> = {
  [MODERATOR_ROLE.admin]: 'admin',
  [MODERATOR_ROLE.moderator]: 'moderator',
};

export function resolveModeratorRoleName(role: number): string {
  if (role in ROLE_NAME_MAP) {
    return ROLE_NAME_MAP[role as ModeratorRole];
  }
  return `unknown(${role})`;
}

export function hasFullModeratorPermission(role: number): boolean {
  return role === MODERATOR_ROLE.admin;
}

export function hasModeratorPermission(role: number): boolean {
  return role === MODERATOR_ROLE.admin || role === MODERATOR_ROLE.moderator;
}
