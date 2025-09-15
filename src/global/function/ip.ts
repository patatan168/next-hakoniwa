import { isIPv4, isIPv6 } from 'net';
import { NextRequest } from 'next/server';

/** ホストの最大経由数 */
const MAX_JUMP_HOSTS = 10;

/**
 * パプリックIPか
 * @param ip IPアドレス
 * @returns パプリックIPか
 */
export function isPublicIp(ip: string): boolean {
  // IPv4 判定
  if (isIPv4(ip)) {
    // 10.0.0.0/8 (プライベート)
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) return false;
    // 172.16.0.0/12 (プライベート)
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(ip)) return false;
    // 192.168.0.0/16 (プライベート)
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(ip)) return false;
    // 127.0.0.1（ループバック）
    if (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) return false;
    // 169.254.0.0/16（リンクローカル）
    if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(ip)) return false;

    return true;
  }
  // IPv6 判定
  if (isIPv6(ip)) {
    // ループバック (::1)
    if (ip === '::1') return false;
    // リンクローカル (fe80::/10)
    if (ip.startsWith('fe80:')) return false;
    // ユニークローカル (fc00::/7)
    const firstBlock = ip.split(':')[0];
    if (firstBlock.startsWith('fc') || firstBlock.startsWith('fd')) return false;

    return true;
  }

  return false;
}

/**
 * リクエストからIPアドレス抽出する
 * @param request Next.jsのリクエスト
 * @returns IPアドレス
 */
export const extractClientIp = (request: NextRequest) => {
  const xForwarded = request.headers.get('x-forwarded-for');
  if (!xForwarded) return null;

  const ips = xForwarded.split(',').map((ip) => ip.trim());
  // NOTE: ホストの最大経由数が多いため、悪意のある接続としてnullを返す
  if (ips.length > MAX_JUMP_HOSTS) return null;

  const publicIps = ips.filter((ip) => {
    // NOTE: デバッグ用に開発環境はローカルホストを許可
    const isLocalHost =
      process.env.NODE_ENV === 'development' &&
      (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip) || ip === '::1');
    return isPublicIp(ip) || isLocalHost;
  });
  return publicIps[0] ?? null;
};
