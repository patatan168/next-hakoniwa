// Next.jsのmetadataと default コンポーネントの両エクスポートのため
/* eslint-disable react-refresh/only-export-components */
import Image from 'next/image';
import { IoAlertCircle, IoInformationCircle } from 'react-icons/io5';
import META_DATA from '../../global/define/metadata';

export const metadata = {
  title: '取扱説明書 - 箱庭諸島',
  description: '箱庭諸島の取扱説明書・遊び方ガイドです。',
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-12 mb-6 flex items-center gap-2 border-b-2 border-emerald-200 pb-2 text-xl font-bold text-gray-800">
      {children}
    </h2>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-8 mb-4 text-lg font-semibold text-gray-700">{children}</h3>;
}

function ItemCard({
  title,
  imageSrc,
  description,
  info,
}: {
  title: string;
  imageSrc: string;
  description: string;
  info?: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row">
      <div className="flex shrink-0 justify-center sm:justify-start">
        <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50 p-1">
          <Image
            src={imageSrc}
            alt={title}
            width={32}
            height={32}
            className="object-contain"
            unoptimized
          />
        </div>
      </div>
      <div className="flex-1">
        <h4 className="text-md mb-1 font-bold text-gray-800">{title}</h4>
        <p className="mb-2 text-sm leading-relaxed text-gray-600">{description}</p>
        {info && (
          <div className="inline-flex items-start gap-1.5 rounded-md border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700">
            <IoInformationCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{info}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function AlertBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <IoAlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

export default function ManualPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          箱庭諸島 取扱説明書
        </h1>
        <p className="text-sm text-gray-500 sm:text-base">
          島を育て、繁栄を目指すシミュレーションゲームの遊び方ガイド
        </p>
      </div>

      <div className="prose prose-emerald max-w-none text-gray-600">
        <SectionTitle>
          <span className="mr-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm text-emerald-800">
            1
          </span>
          ゲームの目的と基本
        </SectionTitle>
        <p className="mb-6 text-base leading-relaxed">
          箱庭諸島は、自分の島を開発し、
          <strong>人口を増やし、資金を稼ぎながら島を豊かにしていく</strong>
          シミュレーションゲームです。
          他の島との同盟や競争、怪獣の襲来などのイベントを乗り越え、最も繁栄した島を目指しましょう。
        </p>

        <div className="mt-8 mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <div className="mb-2 text-lg font-bold text-blue-500">資金</div>
            <p className="text-sm leading-relaxed text-blue-900">
              島の開発やコマンドの実行に必要な単位（単位：{META_DATA.UNIT_MONEY}
              ）。主に町や工場から得られます。
              <br />
              最大 <strong>{META_DATA.MAX_MONEY.toLocaleString()}</strong>
              {META_DATA.UNIT_MONEY}まで貯めることができます。
            </p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
            <div className="mb-2 text-lg font-bold text-amber-600">食料</div>
            <p className="text-sm leading-relaxed text-amber-900">
              人口を維持するために必要です（単位：{META_DATA.UNIT_FOOD}
              ）。毎ターン人口に応じた食料が消費され、不足すると餓死が発生します。
              <br />
              最大 <strong>{META_DATA.MAX_FOOD.toLocaleString()}</strong>
              {META_DATA.UNIT_FOOD}まで備蓄できます。
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <div className="mb-2 text-lg font-bold text-emerald-700">人口</div>
            <p className="text-sm leading-relaxed text-emerald-900">
              島の発展度を示す指標です。人口が増えると消費する食料も増える点に注意が必要です。
            </p>
          </div>
        </div>

        <AlertBox>
          ゲームは一定時間ごとに「ターン」として進行します。
          <br />
          ターンが更新されると、あらかじめ入力しておいた最大{' '}
          <strong>{META_DATA.PLAN_LENGTH}</strong>{' '}
          個の「開発計画」が順次実行されます。毎ターン開始時に、資金の増減や人口の変動、食料の生産・消費が発生します。
        </AlertBox>

        <SectionTitle>
          <span className="mr-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm text-emerald-800">
            2
          </span>
          地形の種類
        </SectionTitle>
        <p className="mb-6">
          島（{META_DATA.MAP_SIZE}×{META_DATA.MAP_SIZE}
          ヘックス）には様々な地形が存在し、それぞれ異なる役割を持っています。
        </p>

        <SubTitle>基本地形</SubTitle>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ItemCard
            title="海 / 浅瀬"
            imageSrc="/img/land/sea.gif"
            description="開発できないエリアです。「埋め立て」を行うことで陸地に変えることができます。浅瀬には「掘削」で海にすることも可能です。"
          />
          <ItemCard
            title="荒地 / 平地"
            imageSrc="/img/land/wasteland.gif"
            description="開発の基本となる土地です。荒地は「整地」することで平地になり、様々な施設を建設できるようになります。"
          />
          <ItemCard
            title="森"
            imageSrc="/img/land/forest.gif"
            description={`木が茂っており、開発するには「伐採」が必要です。伐採すると資金（100本あたり${META_DATA.FOREST_VALUE}${META_DATA.UNIT_MONEY}）を得られます。`}
            info="自然発生のほか、「植林」によって意図的に育てることも可能です。"
          />
          <ItemCard
            title="山"
            imageSrc="/img/land/mountain.gif"
            description="高低差のある土地です。「採掘」による資源確保の対象になることがあります。「地ならし」で平地に戻すことも可能です。"
          />
        </div>

        <SubTitle>施設・設備</SubTitle>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ItemCard
            title="町・都市"
            imageSrc="/img/people/town.gif"
            description="人口を養い、資金を生み出す基本となる地形です。人口規模に応じて村、町、都市と発展していきます。"
            info={`平地に ${META_DATA.VILLAGE_APPEARANCE_RATE}% の確率で自然に発生します。`}
          />
          <ItemCard
            title="農場"
            imageSrc="/img/facility/farm.gif"
            description="島民の「食料」を生産します。人口を維持し飢饉を防ぐために必須の施設です。"
            info={`1人規模あたり毎ターン ${META_DATA.FARM_PER_PEOPLE}${META_DATA.UNIT_FOOD} の食料を生産します。`}
          />
          <ItemCard
            title="工場"
            imageSrc="/img/facility/factory.gif"
            description="「資金」を効率よく生産します。ただし、工業規模が大きくなると島全体の人口増に悪影響（公害）を及ぼすリスクがあります。"
            info={`1人規模あたり毎ターン ${META_DATA.FACTORY_PER_PEOPLE}${META_DATA.UNIT_MONEY} の資金を生産します。`}
          />
          <ItemCard
            title="鉱山・海底油田"
            imageSrc="/img/facility/mining.gif"
            description="山からは鉱山、海の油田からは継続的に多額の資金を得ることができます。ただし油田はいずれ枯渇します。"
            info={`油田からは毎ターン ${META_DATA.OIL_EARN}${META_DATA.UNIT_MONEY}、鉱山は規模×${META_DATA.MINING_PER_PEOPLE}${META_DATA.UNIT_MONEY} の収入があります。`}
          />
        </div>

        <SubTitle>軍事・防衛</SubTitle>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ItemCard
            title="ミサイル基地"
            imageSrc="/img/military/missile.gif"
            description="指定した座標に向けてミサイルを発射し、対象の施設を破壊します。怪獣の迎撃や他島への攻撃に用います。経験値が貯まるとミサイルの装弾数が増えます。"
          />
          <ItemCard
            title="防衛施設"
            imageSrc="/img/military/defense_base.gif"
            description="怪獣の進行を食い止めたり、他島からのミサイル攻撃を自動的に迎撃したりして島を守ります。"
          />
        </div>

        <SectionTitle>
          <span className="mr-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm text-emerald-800">
            3
          </span>
          災害・怪獣
        </SectionTitle>
        <p className="mb-6">
          ターンの更新時には、確率によって様々な災害が発生することがあります。資金や食料の備えを怠らないようにしましょう。
        </p>

        <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="border-b px-4 py-3 font-semibold">災害名</th>
                <th className="border-b px-4 py-3 font-semibold">発生確率 / 条件</th>
                <th className="border-b px-4 py-3 font-semibold">主な被害・影響</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-600">
              <tr>
                <td className="px-4 py-3 font-medium text-gray-800">地震</td>
                <td className="px-4 py-3">{META_DATA.EARTHQUAKE_RATE}%</td>
                <td className="px-4 py-3">
                  島全体の施設が被害を受けます。全壊確率は{META_DATA.EARTHQUAKE_DESTROY_RATE}%です。
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-gray-800">津波</td>
                <td className="px-4 py-3">{META_DATA.TSUNAMI_RATE}%</td>
                <td className="px-4 py-3">海岸沿いの施設が流される危険があります。</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-gray-800">台風</td>
                <td className="px-4 py-3">{META_DATA.TYPHOON_RATE}%</td>
                <td className="px-4 py-3">
                  農場の食料生産が損なわれたり、施設が破壊されたりします。
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-gray-800">隕石・巨大隕石</td>
                <td className="px-4 py-3">
                  {META_DATA.METEORITE_RATE}% / {META_DATA.HUGE_METEORITE_RATE}%
                </td>
                <td className="px-4 py-3">
                  着弾地点周辺が海（浅瀬）になり、甚大な被害をもたらします。
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-gray-800">飢饉（食料不足）</td>
                <td className="px-4 py-3">食料がマイナス時毎ターン</td>
                <td className="px-4 py-3 text-red-600">
                  人口の減少({META_DATA.PEOPLE_LOSS.FAMINE}
                  百人/ターン)や、各種施設・暴動による破壊（{META_DATA.LACK_FOOD_DESTROY_RATE}
                  %）が発生します。
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-gray-800">地盤沈下</td>
                <td className="px-4 py-3">
                  面積{META_DATA.FALL_DOWN_BORDER}万坪以上時 {META_DATA.FALL_DOWN_RATE}%
                </td>
                <td className="px-4 py-3">
                  陸地の一部が水没し、浅瀬になります。過度な埋め立てには注意が必要です。
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <SubTitle>怪獣の襲来</SubTitle>
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-rose-100 bg-rose-50 p-6 text-rose-900 sm:flex-row sm:items-start">
          <div className="flex shrink-0 flex-wrap justify-center gap-2 sm:justify-start">
            <Image
              src="/img/monster/inora.gif"
              alt="怪獣（いのら）"
              width={32}
              height={32}
              className="pixelated"
              unoptimized
            />
            <Image
              src="/img/monster/red_inora.gif"
              alt="怪獣（レッドいのら）"
              width={32}
              height={32}
              className="pixelated"
              unoptimized
            />
            <Image
              src="/img/monster/king_inora.gif"
              alt="怪獣（キングいのら）"
              width={32}
              height={32}
              className="pixelated"
              unoptimized
            />
          </div>
          <div>
            <p className="mb-2 text-sm leading-relaxed">
              島の規模が大きくなると、面積の割合（{META_DATA.MONSTER_RATE}% /
              100万坪）に応じて怪獣が上陸することがあります。
              <br />
              怪獣は島内を移動しながら様々な地形を踏み荒らしてしまう脅威です。
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-800/80">
              <li>ミサイル基地からミサイルを発射して迎撃する。</li>
              <li>防衛施設を建設し、被害を食い止めながら撃退を待つ。</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-gray-400">
          箱庭諸島 バージョン {META_DATA.VERSION}
        </div>
      </div>
    </div>
  );
}
