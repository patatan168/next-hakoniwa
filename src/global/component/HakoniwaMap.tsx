import { islandInfo, islandInfoData, islandInfoTurnProgress } from '@/db/kysely';
import { default as META } from '@/global/define/metadata';
import { getPlanDefine, getPlanSelect, validLandType } from '@/global/define/planType';
import { isEqual } from 'es-toolkit';
import Image from 'next/image';
import { CSSProperties, forwardRef, Fragment, memo, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { getMapDefine, getMapImpPath, getMapInfoText, getMapName } from '../define/mapType';
import { usePlanDataStore } from '../store/usePlanDataStore';
import Button from './Button';
import Loading from './Loading';
import Modal from './Modal';
import { RangeSliderRHF } from './RangeSliderRHF';
import { SelectRHF } from './SelectRHF';
import scssStyle from './style/HakoniwaMap.module.scss';
import { TextFieldRHF } from './TextFieldRHF';
import Tooltip from './Tooltip';

type SpacerProps = {
  mapWidth: number;
  rows: number;
  cols: number;
  num?: number;
  algin?: 'left' | 'center' | 'right';
};

const Spacer = memo(
  function Spacer({ mapWidth, rows, cols, num, algin }: SpacerProps) {
    // algin
    const leftStyle =
      algin === 'left' ? 'left-[25%]' : algin === 'right' ? 'right-[25%]' : 'left-[50%]';

    return (
      <>
        <div className={`h-full w-full col-span-${cols} row-span-${rows} relative`}>
          <Image src={'/img/land/sea.gif'} alt={'外海'} sizes={`100%`} fill priority />
          {num !== undefined && (
            <p
              className={`${scssStyle['map-overlay']} ${leftStyle}`}
              style={{ fontSize: (13 * mapWidth) / baseMapPixel }}
            >
              {num}
            </p>
          )}
        </div>
      </>
    );
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);

type mapInfoTipsProps = {
  islandName: string;
  mapPixel: number;
  mapInfoText: string;
  src: string;
  alt: string;
};
const MapInfoTips = memo(
  function MapInfoTips({ islandName, mapPixel, mapInfoText, src, alt }: mapInfoTipsProps) {
    return (
      <>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, min-content)',
          }}
        >
          <div style={{ width: mapPixel, height: mapPixel }}>
            <Image
              style={{ outline: '1px solid rgb(125, 125, 125)' }}
              src={src}
              alt={alt}
              width={mapPixel}
              height={mapPixel}
              loading="lazy"
            />
          </div>
          <div className="ml-1">
            <p className="leading-tight">
              {`${islandName}島`}
              <br />
              {mapInfoText}
            </p>
          </div>
        </div>
      </>
    );
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);

const getToolTipPosition = (x: number, y: number) => {
  const topBottom = y === META.MAP_SIZE - 1 ? 'top-' : y === 0 ? 'bottom-' : '';
  if (x < META.MAP_SIZE / 3) {
    return `${topBottom}right`;
  } else if (x > (2 * META.MAP_SIZE) / 3) {
    return `${topBottom}left`;
  } else {
    return y < META.MAP_SIZE / 2 ? 'bottom' : 'top';
  }
};

type HakoniwaMapProps = {
  style?: CSSProperties;
  className?: string;
  isLoading: boolean;
  islandName?: string;
  data?: islandInfoData;
  isDevelop?: boolean;
  uuid?: string;
};

/* Mapのピクセルサイズ */
const baseMapPixel = 32;

type MapClickModalProps = {
  x: number;
  y: number;
  mapWidth: number;
  mapHeight: number;
  uuid: string;
  data: islandInfoData;
  open: boolean;
  openToggle: (open: boolean) => void;
};

const MapCellPreview = memo(
  ({
    data,
    cx,
    cy,
    isCenter,
    modalMapSize,
  }: {
    data: islandInfoData;
    cx: number;
    cy: number;
    isCenter?: boolean;
    modalMapSize: number;
  }) => {
    const cell = data.find((d: islandInfo) => d.x === cx && d.y === cy);
    if (!cell) {
      return (
        <div className="relative" style={{ width: modalMapSize, height: modalMapSize }}>
          <Image src={'/img/land/sea.gif'} alt={'外海'} fill sizes={`${modalMapSize}px`} />
          <p
            className={scssStyle['map-overlay']}
            style={{ left: `50%`, fontSize: (13 * modalMapSize) / baseMapPixel }}
          >
            外
          </p>
        </div>
      );
    }
    const { imgPath, name } = getMapDefine(cell.type);
    const src = getMapImpPath(cell.type, cell.landValue, imgPath);
    const alt = getMapName(cell.type, cell.landValue, name);
    return (
      <div className="relative" style={{ width: modalMapSize, height: modalMapSize }}>
        <Image
          src={src}
          alt={alt}
          fill
          className={isCenter ? 'brightness-150 contrast-115' : ''}
          sizes={`${modalMapSize}px`}
        />
        {isCenter && (
          <div
            className="absolute inset-0 animate-pulse border-2 border-yellow-400"
            style={{
              boxShadow: 'inset 0 0 8px rgba(250, 204, 21, 0.6), 0 0 8px rgba(250, 204, 21, 0.4)',
            }}
          />
        )}
      </div>
    );
  }
);
MapCellPreview.displayName = 'MapCellPreview';

const NeighboringCellsPreview = memo(
  ({
    x,
    y,
    data,
    modalMapSize,
  }: {
    x: number;
    y: number;
    data: islandInfoData;
    modalMapSize: number;
  }) => {
    const isEvenY = y % 2 === 0;
    const topRow = isEvenY
      ? [
          { x: x, y: y - 1 },
          { x: x + 1, y: y - 1 },
        ]
      : [
          { x: x - 1, y: y - 1 },
          { x: x, y: y - 1 },
        ];
    const centerRow = [
      { x: x - 1, y },
      { x, y },
      { x: x + 1, y },
    ];
    const bottomRow = isEvenY
      ? [
          { x: x, y: y + 1 },
          { x: x + 1, y: y + 1 },
        ]
      : [
          { x: x - 1, y: y + 1 },
          { x: x, y: y + 1 },
        ];

    return (
      <div className="flex justify-center">
        <div style={{ width: modalMapSize * 3 }} className="border border-gray-400">
          <div className="flex" style={{ marginLeft: modalMapSize / 2 }}>
            {topRow.map((pos, i) => (
              <Fragment key={`top-${i}`}>
                <MapCellPreview data={data} cx={pos.x} cy={pos.y} modalMapSize={modalMapSize} />
              </Fragment>
            ))}
          </div>
          <div className="flex">
            {centerRow.map((pos, i) => (
              <Fragment key={`center-${i}`}>
                <MapCellPreview
                  data={data}
                  cx={pos.x}
                  cy={pos.y}
                  modalMapSize={modalMapSize}
                  isCenter={i === 1}
                />
              </Fragment>
            ))}
          </div>
          <div className="flex" style={{ marginLeft: modalMapSize / 2 }}>
            {bottomRow.map((pos, i) => (
              <Fragment key={`bottom-${i}`}>
                <MapCellPreview data={data} cx={pos.x} cy={pos.y} modalMapSize={modalMapSize} />
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  }
);
NeighboringCellsPreview.displayName = 'NeighboringCellsPreview';

const MapClickModal = ({
  x,
  y,
  mapWidth,
  mapHeight,
  uuid,
  data,
  open,
  openToggle,
}: MapClickModalProps) => {
  const [category, setCategory] = useState<'優先' | '開発' | '建設' | '運営' | '攻撃'>('優先');
  const [isContinuous, setIsContinuous] = useState(true);

  const { control, setValue, getValues } = useForm<{
    plan: string;
    times: number;
    position: number;
  }>({
    defaultValues: {
      plan: '',
      times: 1,
      position: 1,
    },
  });

  const plan = useWatch({ control, name: 'plan' });
  const times = useWatch({ control, name: 'times' });
  const position = useWatch({ control, name: 'position' });

  const currentItems = usePlanDataStore((state) => state.items);
  const setItems = usePlanDataStore((state) => state.setItems);

  // 予測マップタイプ
  const predictedType = useMemo(() => {
    let currentType = data.find((d: islandInfo) => d.x === x && d.y === y)?.type || 'sea';

    // 挿入先(position)より前にある、同じ座標の計画を抽出
    const previousPlans = currentItems
      .slice(0, Number(position) - 1)
      .filter((item) => item.x === x && item.y === y);

    for (const item of previousPlans) {
      const planTimes = Number(item.times);
      const pd = getPlanDefine(item.plan);
      for (let i = 0; i < planTimes; i++) {
        currentType = pd.predictLandType ? pd.predictLandType(currentType) : currentType;
      }
    }
    return currentType;
  }, [data, x, y, currentItems, position]);

  // 選択可能な計画リストを作成
  const planOptions = useMemo(() => {
    const allPlans = getPlanSelect();
    const currentIslandMap = structuredClone(data);

    // 予測地形を反映
    const targetCellIndex = currentIslandMap.findIndex((d: islandInfo) => d.x === x && d.y === y);
    if (targetCellIndex !== -1) {
      currentIslandMap[targetCellIndex].type = predictedType;
    }

    // validLandTypeはisland_infoのみ参照するためキャストで対応
    const dummyIsland = {
      island_info: currentIslandMap,
    } as islandInfoTurnProgress;

    return allPlans.filter((option) => {
      const planDefine = getPlanDefine(option.value);
      if (category === '優先') {
        return validLandType(dummyIsland, planDefine, x, y);
      }
      return planDefine.category === category;
    });
  }, [x, y, data, category, predictedType]);

  // planOptionsが変わったときに、現在のplanが選択肢になければリセット
  useEffect(() => {
    const currentPlan = getValues('plan');
    if (planOptions.length > 0) {
      if (!currentPlan || !planOptions.find((p) => p.value === currentPlan)) {
        setValue('plan', planOptions[0].value);
      }
    } else {
      setValue('plan', '');
    }
  }, [planOptions, setValue, getValues]);

  const modalMapSize = useMemo(() => {
    return Math.min(mapWidth, mapHeight) * 0.8;
  }, [mapWidth, mapHeight]);

  // 選択中の計画の情報を取得
  const { maxTimes, planDescription } = useMemo(() => {
    if (!planOptions.length || plan === '') return { maxTimes: 1, planDescription: '' };
    const planDefine = getPlanDefine(plan);
    return { maxTimes: planDefine.maxTimes, planDescription: planDefine.description };
  }, [plan, planOptions]);

  useEffect(() => {
    // planが変更された場合はtimesを1に戻す
    setValue('times', 1);
  }, [plan, setValue]);

  const handleInsertPlan = () => {
    if (!planOptions.length || plan === '') return;

    const newPlan = {
      id: -1, // 一時的なID
      plan_no: -1, // 一時的なNo
      edit: false,
      from_uuid: uuid,
      to_uuid: uuid,
      times: Number(times),
      x: x,
      y: y,
      plan: plan,
    };

    // 指定位置に挿入
    const newItems = [...currentItems];
    newItems.splice(Number(position) - 1, 0, newPlan);

    // PLAN_LENGTH に収めて、IDとNoを振り直す
    const reindexed = newItems.slice(0, META.PLAN_LENGTH).map((item, index) => ({
      ...item,
      id: index,
      plan_no: index,
    }));

    setItems(reindexed, true);
    if (!isContinuous) {
      openToggle(false);
    } else {
      setValue('position', Number(position) + 1);
      setCategory('優先');
    }
  };

  const categories = ['優先', '開発', '建設', '運営', '攻撃'] as const;

  const body = (
    <div className="flex flex-col gap-4">
      <NeighboringCellsPreview x={x} y={y} data={data} modalMapSize={modalMapSize} />
      <div>
        <div className="mb-2 flex border-b border-gray-200 dark:border-gray-700">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`flex-1 cursor-pointer p-2 text-center text-sm font-medium ${
                category === cat
                  ? 'border-b-2 border-green-500 text-green-600 dark:text-green-500'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
          計画を選択
        </label>
        <Tooltip
          position="bottom"
          tooltipComp={
            <p className="max-w-sm min-w-64 text-left text-sm whitespace-pre-wrap md:text-base">
              {planDescription}
            </p>
          }
        >
          <SelectRHF name="plan" className="w-full" control={control} options={planOptions} />
        </Tooltip>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm whitespace-nowrap" htmlFor={`times`}>
          計画数
        </label>
        <RangeSliderRHF
          name="times"
          className="flex-1"
          disabled={maxTimes === 1}
          control={control}
          min={1}
          max={maxTimes}
          isBottomSpace={false}
        />
      </div>
    </div>
  );

  const footer = (
    <div className="flex w-full items-center justify-between">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            id="continuous-input"
            type="checkbox"
            checked={isContinuous}
            onChange={(e) => setIsContinuous(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <label
            htmlFor="continuous-input"
            className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            連続入力
          </label>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {currentItems.length > 0 && (
          <>
            <label className="text-sm whitespace-nowrap" htmlFor={`position`}>
              挿入先
            </label>
            <TextFieldRHF
              name="position"
              type="number"
              className="w-[4em]"
              control={control}
              min={1}
              max={currentItems.length + 1}
              isBottomSpace={false}
            />
          </>
        )}
        <Button onClick={handleInsertPlan}>計画の挿入</Button>
      </div>
    </div>
  );

  const targetCell = data.find((d: islandInfo) => d.x === x && d.y === y);
  const mapInfoText = targetCell ? getMapInfoText(x, y, targetCell.type, targetCell.landValue) : '';

  return (
    <Modal
      open={open}
      openToggle={openToggle}
      header={`${mapInfoText}`}
      body={body}
      footer={footer}
      portal={false}
      className="!max-h-[96%] !w-[96%] !max-w-md"
    />
  );
};

export default memo(
  forwardRef<HTMLDivElement, HakoniwaMapProps>(function HakoniwaMap(
    { style, className, isLoading, islandName, data, isDevelop = false, uuid }: HakoniwaMapProps,
    ref
  ) {
    /* 座標表示用のデータを用意する[0,..,X] */
    const coordinate = Array.from({ length: META.MAP_SIZE }, (_, i) => i);
    const [mapWidth, setMapWidth] = useState<number>(baseMapPixel);
    const [mapHeight, setMapHeight] = useState<number>(baseMapPixel);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPoint, setSelectedPoint] = useState({ x: 0, y: 0 });

    if (isLoading || !islandName || !data) {
      return <Loading />;
    }

    const handleMapClick = (x: number, y: number) => {
      if (isDevelop && uuid) {
        setSelectedPoint({ x, y });
        setModalOpen(true);
      }
    };

    return (
      <div
        ref={ref}
        style={style}
        className={`${scssStyle['map-grid']} ${className} relative ${scssStyle['map-container']}`}
      >
        {modalOpen && uuid && (
          <div className="absolute inset-0 z-50">
            <MapClickModal
              key={`${selectedPoint.x}-${selectedPoint.y}`}
              mapWidth={mapWidth}
              mapHeight={mapHeight}
              x={selectedPoint.x}
              y={selectedPoint.y}
              uuid={uuid}
              data={data}
              open={modalOpen}
              openToggle={setModalOpen}
            />
          </div>
        )}
        <Spacer mapWidth={mapWidth} rows={1} cols={2} />
        {coordinate.map((x) => (
          <Spacer
            key={`spacer-${x}`}
            mapWidth={mapWidth}
            rows={1}
            cols={2}
            num={x}
            algin={'left'}
          />
        ))}
        {data.map(({ x, y, type, landValue }: islandInfo) => {
          const { imgPath, name } = getMapDefine(type);
          const alt = getMapName(type, landValue, name);
          const src = getMapImpPath(type, landValue, imgPath);
          const mapInfoText = getMapInfoText(x, y, type, landValue);
          const tooltipPosition = getToolTipPosition(x, y);
          const divCallback = (node: HTMLDivElement) => {
            if (x !== 0 || y !== 0) return;
            if (node !== null) {
              const { width, height } = node.getBoundingClientRect();
              setMapWidth(Math.ceil(width * 100) / 100);
              setMapHeight(Math.ceil(height * 100) / 100);
            }
          };
          return (
            <Fragment key={`map-${x}-${y}`}>
              {x === 0 && y % 2 === 0 && (
                <Spacer mapWidth={mapWidth} rows={2} cols={2} num={y} algin={'left'} />
              )}
              {x === 0 && y % 2 === 1 && <Spacer mapWidth={mapWidth} rows={2} cols={1} num={y} />}
              <div
                ref={x === 0 && y === 0 ? divCallback : undefined}
                className={`col-span-2 row-span-2 h-full w-full ${isDevelop && !modalOpen ? 'cursor-pointer hover:z-[1000]' : ''}`}
                onClick={() => handleMapClick(x, y)}
              >
                <Tooltip
                  position={tooltipPosition}
                  tooltipComp={
                    <MapInfoTips
                      islandName={islandName}
                      mapPixel={mapWidth}
                      mapInfoText={mapInfoText}
                      src={src}
                      alt={alt}
                    />
                  }
                >
                  <Image
                    className="hover:brightness-150 hover:contrast-115"
                    src={src}
                    alt={alt}
                    sizes={`100%`}
                    fill
                  />
                </Tooltip>
              </div>
              {x === META.MAP_SIZE - 1 && y % 2 === 1 && (
                <Spacer mapWidth={mapWidth} rows={2} cols={1} />
              )}
            </Fragment>
          );
        })}
      </div>
    );
  }),
  (oldProps, newProps) => isEqual(oldProps, newProps)
);
