/**
 * @module loginBonus
 * @description ログインボーナスの判定・付与処理。
 */
import { db, Island, isSqlite } from '@/db/kysely';
import { getResource } from '@/global/function/resource';

export type LoginBonusResult = {
  money: number;
  food: number;
  consecutive_login_days: number;
};

const SECONDS_PER_DAY = 86400;
const MAX_CONCURRENT_RETRY_COUNT = 3;

class RetryableLoginBonusConflictError extends Error {
  constructor() {
    super('login bonus state changed during update');
    this.name = 'RetryableLoginBonusConflictError';
  }
}

const getUpdatedRowCount = (numUpdatedRows: bigint | number | undefined) => {
  if (typeof numUpdatedRows === 'bigint') {
    return Number(numUpdatedRows);
  }

  return numUpdatedRows ?? 0;
};

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

  // ボーナス報酬内容
  const envMoney = parseInt(process.env.NEXT_PUBLIC_LOGIN_BONUS_MONEY || '200', 10);
  const envFood = parseInt(process.env.NEXT_PUBLIC_LOGIN_BONUS_FOOD || '2000', 10);
  const bonusMoney = Number.isNaN(envMoney) ? 200 : Math.max(0, envMoney);
  const bonusFood = Number.isNaN(envFood) ? 2000 : Math.max(0, envFood);

  for (let retryCount = 0; retryCount < MAX_CONCURRENT_RETRY_COUNT; retryCount += 1) {
    const nowSeconds = Math.floor(Date.now() / 1000);

    try {
      const bonusResult = await db.transaction().execute(async (trx) => {
        const lastLoginBaseQuery = trx
          .selectFrom('last_login')
          .selectAll()
          .where('uuid', '=', uuid);

        const lastLogin = isSqlite
          ? await lastLoginBaseQuery.executeTakeFirst()
          : await lastLoginBaseQuery.forUpdate().executeTakeFirst();

        if (!lastLogin) {
          return null;
        }

        const currentDay = getTzDayNumber(nowSeconds);
        const lastBonusDay = getTzDayNumber(Number(lastLogin.last_bonus_received_at));

        if (currentDay <= lastBonusDay) {
          return null;
        }

        const currentIslandBaseQuery = trx
          .selectFrom('island')
          .select(['money', 'food'])
          .where('uuid', '=', uuid);

        const currentIsland = isSqlite
          ? await currentIslandBaseQuery.executeTakeFirst()
          : await currentIslandBaseQuery.forUpdate().executeTakeFirst();

        if (!currentIsland) {
          return null;
        }

        const isConsecutive = currentDay === lastBonusDay + 1;
        const newConsecutiveDays = isConsecutive ? lastLogin.consecutive_login_days + 1 : 1;
        const lastBonusReceivedAtValue = (
          typeof lastLogin.last_bonus_received_at === 'string' ? String(nowSeconds) : nowSeconds
        ) as typeof lastLogin.last_bonus_received_at;

        const currentResource = getResource({
          money: currentIsland.money,
          food: currentIsland.food,
        });

        const nextResource = getResource(currentResource, {
          money: bonusMoney,
          food: bonusFood,
        });

        const lastLoginUpdateResult = await trx
          .updateTable('last_login')
          .set({
            last_bonus_received_at: lastBonusReceivedAtValue,
            consecutive_login_days: newConsecutiveDays,
          })
          .where('uuid', '=', uuid)
          .where('last_bonus_received_at', '=', lastLogin.last_bonus_received_at)
          .executeTakeFirst();

        if (getUpdatedRowCount(lastLoginUpdateResult.numUpdatedRows) !== 1) {
          throw new RetryableLoginBonusConflictError();
        }

        const islandUpdateResult = await trx
          .updateTable('island')
          .set({
            money: nextResource.money,
            food: nextResource.food,
          })
          .where('uuid', '=', uuid)
          .where('money', '=', currentIsland.money)
          .where('food', '=', currentIsland.food)
          .executeTakeFirst();

        if (getUpdatedRowCount(islandUpdateResult.numUpdatedRows) !== 1) {
          throw new RetryableLoginBonusConflictError();
        }

        const receivedMoney = Math.max(0, nextResource.money - currentResource.money);
        const receivedFood = Math.max(0, nextResource.food - currentResource.food);

        return {
          nextResource,
          loginBonus: {
            money: receivedMoney,
            food: receivedFood,
            consecutive_login_days: newConsecutiveDays,
          },
        };
      });

      if (!bonusResult) {
        return null;
      }

      // 引数の islandData を直接更新
      islandData.money = bonusResult.nextResource.money;
      islandData.food = bonusResult.nextResource.food;

      return bonusResult.loginBonus;
    } catch (error) {
      if (error instanceof RetryableLoginBonusConflictError) {
        continue;
      }

      throw error;
    }
  }

  return null;
};
