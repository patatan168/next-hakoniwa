import { db, Island } from '@/db/kysely';
import { sql } from 'kysely';

export type LoginBonusResult = {
  money: number;
  food: number;
  consecutive_login_days: number;
};

const SECONDS_PER_DAY = 86400;

/**
 * 指定されたタイムゾーン（デフォルトは NEXT_PUBLIC_TURN_TIMEZONE）における
 * UNIX秒からの経過日数を計算します。
 * 朝4時を日付の区切りとするため、内部的には4時間前の時刻として日付判定を行います。
 * @param unixSeconds UNIXエポックからの秒数
 * @returns 経過日数
 */
const getTzDayNumber = (unixSeconds: number) => {
  const tz = process.env.NEXT_PUBLIC_TURN_TIMEZONE || 'Asia/Tokyo';
  // 朝4時リセットのため、現在時刻から4時間(14400秒)引いて判定する
  const adjustedSeconds = unixSeconds - 4 * 3600;

  // Dateオブジェクトを作成し、指定タイムゾーンにおける「年、月、日」を取得
  const date = new Date(adjustedSeconds * 1000);
  const tzDateString = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  // 得られた日付文字列 (MM/DD/YYYY) をもとに、UTCの深夜0時としてパースして日数を算出
  // （これにより、指定タイムゾーンでの「どの日か」という絶対的な日数インデックスが得られる）
  const [month, day, year] = tzDateString.split('/');
  const tzDateMidnightUTC = Date.UTC(Number(year), Number(month) - 1, Number(day));

  return Math.floor(tzDateMidnightUTC / (SECONDS_PER_DAY * 1000));
};

/**
 * ログインボーナスを付与します
 * @param uuid ユーザーUUID
 * @param islandData ユーザーの島データ（関数内で変更が反映されます）
 * @returns 獲得したログインボーナスの情報、または未発生の場合は null
 */
export const grantLoginBonus = async (
  uuid: string,
  islandData: Island
): Promise<LoginBonusResult | null> => {
  if (process.env.NEXT_PUBLIC_ENABLE_LOGIN_BONUS === 'false') {
    return null;
  }

  const lastLogin = await db
    .selectFrom('last_login')
    .selectAll()
    .where('uuid', '=', uuid)
    .executeTakeFirst();

  if (!lastLogin) return null;

  const nowSeconds = Math.floor(Date.now() / 1000);
  const currentDay = getTzDayNumber(nowSeconds);
  const lastBonusDay = getTzDayNumber(lastLogin.last_bonus_received_at);

  if (currentDay > lastBonusDay) {
    const isConsecutive = currentDay === lastBonusDay + 1;
    const newConsecutiveDays = isConsecutive ? lastLogin.consecutive_login_days + 1 : 1;

    // ボーナス報酬内容
    const envMoney = parseInt(process.env.NEXT_PUBLIC_LOGIN_BONUS_MONEY || '200', 10);
    const envFood = parseInt(process.env.NEXT_PUBLIC_LOGIN_BONUS_FOOD || '2000', 10);
    const bonusMoney = Number.isNaN(envMoney) ? 200 : envMoney;
    const bonusFood = Number.isNaN(envFood) ? 2000 : envFood;

    // トランザクションでDB更新
    await db.transaction().execute(async (trx) => {
      // islandTableの更新
      await trx
        .updateTable('island')
        .set({
          money: sql`money + ${bonusMoney}`,
          food: sql`food + ${bonusFood}`,
        })
        .where('uuid', '=', uuid)
        .execute();

      // lastLoginTableの更新
      await trx
        .updateTable('last_login')
        .set({
          last_bonus_received_at: nowSeconds,
          consecutive_login_days: newConsecutiveDays,
        })
        .where('uuid', '=', uuid)
        .execute();
    });

    // 引数の islandData を直接更新
    islandData.money += bonusMoney;
    islandData.food += bonusFood;

    return {
      money: bonusMoney,
      food: bonusFood,
      consecutive_login_days: newConsecutiveDays,
    };
  }

  return null;
};
