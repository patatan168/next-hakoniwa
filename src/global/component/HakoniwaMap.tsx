import { islandInfoData, islandSchemaType } from '@/db/schema/islandTable';
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
import Tooltip from './Tooltip';
import scssStyle from './style/HakoniwaMap.module.scss';

type SpacerProps = {
  mapWidth: number;
  mapHeight: number;
  rows: number;
  cols: number;
  num?: number;
  algin?: 'left' | 'center' | 'right';
};

const Spacer = memo(
  function Spacer({ mapWidth, mapHeight, rows, cols, num, algin }: SpacerProps) {
    // algin
    let left = 50;
    if (algin === 'left') {
      left = 25;
    } else if (algin === 'right') {
      left = 75;
    }

    return (
      <>
        <div
          style={{ width: (mapWidth * cols) / 2, height: (mapHeight * rows) / 2 }}
          className={`col-span-${cols} row-span-${rows} relative`}
        >
          <Image src={'/img/land/sea.gif'} alt={'外海'} sizes={`${mapWidth}px`} fill priority />
          {num !== undefined && (
            <p
              className={scssStyle['map-overlay']}
              style={{ left: `${left}%`, fontSize: (13 * mapWidth) / baseMapPixel }}
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
  // 選択可能な計画リストを作成
  const planOptions = useMemo(() => {
    const allPlans = getPlanSelect();
    const currentIslandMap = structuredClone(data);
    // validLandTypeはisland_infoのみ参照するためキャストで対応
    const dummyIsland = {
      island_info: currentIslandMap,
    } as islandSchemaType;

    return allPlans.filter((option) => {
      const planDefine = getPlanDefine(option.value);
      return validLandType(dummyIsland, planDefine, x, y);
    });
  }, [x, y, data]);

  const { control, setValue } = useForm<{ plan: string; times: number; position: number }>({
    defaultValues: {
      plan: planOptions.length > 0 ? planOptions[0].value : '',
      times: 1,
      position: 1,
    },
  });
  const plan = useWatch({ control, name: 'plan' });
  const times = useWatch({ control, name: 'times' });
  const position = useWatch({ control, name: 'position' });

  // 選択中の計画のmaxTimesを取得
  const maxTimes = useMemo(() => {
    if (!planOptions.length || plan === '') return 1;
    const planDefine = getPlanDefine(plan);
    return planDefine.maxTimes;
  }, [plan]);

  useEffect(() => {
    // planが変更された場合はtimesを1に戻す
    setValue('times', 1);
  }, [plan]);

  const currentItems = usePlanDataStore((state) => state.items);
  const setItems = usePlanDataStore((state) => state.setItems);

  const handleInsertPlan = () => {
    if (!planOptions.length || plan === '') return;

    const newPlan = {
      id: -1, // 一時的なID
      plan_no: -1, // 一時的なNo
      edit: false,
      from_uuid: uuid,
      to_uuid: uuid,
      times: times,
      x: x,
      y: y,
      plan: plan,
    };

    // 指定位置に挿入し、IDとNoを振り直す
    const newItems = [...currentItems];
    newItems.splice(position - 1, 0, newPlan);
    const reindexed = newItems.map((item, index) => ({
      ...item,
      id: index,
      plan_no: index,
    }));

    setItems(reindexed, true);
    openToggle(false);
  };

  const renderCell = (cx: number, cy: number, isCenter = false) => {
    const cell = data.find((d) => d.x === cx && d.y === cy);
    if (!cell) {
      return (
        <div className="relative" style={{ width: mapWidth, height: mapHeight }}>
          <Image src={'/img/land/sea.gif'} alt={'外海'} fill sizes={`${mapWidth}px`} />
          <p
            className={scssStyle['map-overlay']}
            style={{ left: `50%`, fontSize: (13 * mapWidth) / baseMapPixel }}
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
      <div className="relative" style={{ width: mapWidth, height: mapHeight }}>
        <Image
          src={src}
          alt={alt}
          fill
          className={isCenter ? 'brightness-150 contrast-115' : ''}
          sizes={`${mapWidth}px`}
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
  };

  // 六角形グリッドの隣接セル座標を計算
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

  const body = (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center">
        <div style={{ width: mapWidth * 3 }} className="border border-gray-400">
          {/* 上段: 2セル、半ブロックオフセット */}
          <div className="flex" style={{ marginLeft: mapWidth / 2 }}>
            {topRow.map((pos, i) => (
              <Fragment key={`top-${i}`}>{renderCell(pos.x, pos.y)}</Fragment>
            ))}
          </div>
          {/* 中段: 3セル（中央を光らせる） */}
          <div className="flex">
            {centerRow.map((pos, i) => (
              <Fragment key={`center-${i}`}>{renderCell(pos.x, pos.y, i === 1)}</Fragment>
            ))}
          </div>
          {/* 下段: 2セル、半ブロックオフセット */}
          <div className="flex" style={{ marginLeft: mapWidth / 2 }}>
            {bottomRow.map((pos, i) => (
              <Fragment key={`bottom-${i}`}>{renderCell(pos.x, pos.y)}</Fragment>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
          計画を選択
        </label>
        <SelectRHF name="plan" className="w-full" control={control} options={planOptions} />
      </div>
      {maxTimes > 1 && (
        <div className="flex items-center gap-2">
          <label className="text-sm" htmlFor={`times`}>
            計画数
          </label>
          <RangeSliderRHF
            name="times"
            control={control}
            min={1}
            max={maxTimes}
            isBottomSpace={false}
          />
        </div>
      )}
    </div>
  );

  const footer = (
    <div className="flex w-full flex-col gap-2">
      {currentItems.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-sm" htmlFor={`position`}>
            挿入先
          </label>
          <RangeSliderRHF
            name="position"
            control={control}
            min={1}
            max={currentItems.length}
            isBottomSpace={false}
          />
        </div>
      )}
      <div className="mt-2 flex justify-end">
        <Button onClick={handleInsertPlan}>計画の挿入</Button>
      </div>
    </div>
  );

  const targetCell = data.find((d) => d.x === x && d.y === y);
  const mapInfoText = targetCell ? getMapInfoText(x, y, targetCell.type, targetCell.landValue) : '';

  return (
    <Modal
      open={open}
      openToggle={openToggle}
      header={`${mapInfoText}`}
      body={body}
      footer={footer}
      portal={false}
    />
  );
};

/* Mapのピクセルサイズ */
const baseMapPixel = 32;

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
      <div ref={ref} style={style} className={`${scssStyle['map-grid']} ${className} relative`}>
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
        <Spacer mapWidth={mapWidth} mapHeight={mapHeight} rows={1} cols={2} />
        {coordinate.map((x) => (
          <Spacer
            key={`spacer-${x}`}
            mapWidth={mapWidth}
            mapHeight={mapHeight}
            rows={1}
            cols={2}
            num={x}
            algin={'left'}
          />
        ))}
        {data.map(({ x, y, type, landValue }) => {
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
                <Spacer
                  mapWidth={mapWidth}
                  mapHeight={mapHeight}
                  rows={2}
                  cols={2}
                  num={y}
                  algin={'left'}
                />
              )}
              {x === 0 && y % 2 === 1 && (
                <Spacer mapWidth={mapWidth} mapHeight={mapHeight} rows={2} cols={1} num={y} />
              )}
              <div
                ref={divCallback}
                className={`relative col-span-2 row-span-2 ${isDevelop && !modalOpen ? 'cursor-pointer hover:z-[1000]' : ''}`}
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
                  <div className="relative" style={{ width: mapWidth, height: mapHeight }}>
                    <Image
                      className="hover:brightness-150 hover:contrast-115"
                      src={src}
                      alt={alt}
                      sizes={`${mapWidth}px`}
                      fill
                      loading="lazy"
                    />
                  </div>
                </Tooltip>
              </div>
              {x === META.MAP_SIZE - 1 && y % 2 === 1 && (
                <Spacer mapWidth={mapWidth} mapHeight={mapHeight} rows={2} cols={1} />
              )}
            </Fragment>
          );
        })}
      </div>
    );
  }),
  (oldProps, newProps) => isEqual(oldProps, newProps)
);
