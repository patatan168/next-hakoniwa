/**
 * @module LoginBonusModal
 * @description ログインボーナスモーダルコンポーネント。
 */
import Modal from '@/global/component/Modal';
import META_DATA from '@/global/define/metadata';
import { LoginBonusResult } from '@/global/function/loginBonus';

export const LoginBonusModal = ({
  showLoginBonus,
  setShowLoginBonus,
  loginBonus,
}: {
  showLoginBonus: boolean;
  setShowLoginBonus: (show: boolean) => void;
  loginBonus?: LoginBonusResult | null;
}) => {
  return (
    <Modal
      open={showLoginBonus}
      openToggle={setShowLoginBonus}
      header="ログインボーナス！"
      body={
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="text-xl font-bold text-green-600">
            連続ログイン: {loginBonus?.consecutive_login_days || 1}日目！
          </div>
          <div className="w-full rounded-md bg-gray-100 p-4 text-center dark:bg-gray-700">
            <p className="text-gray-800 dark:text-gray-200">
              本日のログイン報酬として以下を獲得しました。
            </p>
            <ul className="mt-2 text-lg font-semibold text-blue-600 dark:text-blue-400">
              {loginBonus?.money ? (
                <li>
                  資金 {loginBonus.money.toLocaleString()} {META_DATA.UNIT_MONEY}
                </li>
              ) : null}
              {loginBonus?.food ? (
                <li>
                  食料 {loginBonus.food.toLocaleString()} {META_DATA.UNIT_FOOD}
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      }
    />
  );
};
