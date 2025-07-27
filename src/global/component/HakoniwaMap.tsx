import { islandInfoData } from '@/db/schema/islandTable';
import { default as META } from '@/global/define/metadata';
import { isEqual } from 'es-toolkit';
import Image from 'next/image';
import { CSSProperties, Fragment, memo, useState } from 'react';
import { getMapDefine, getMapImpPath, getMapInfoText, getMapName } from '../define/mapType';
import Loading from './Loading';
import Tooltip from './Tooltip';

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
        <li
          style={{ width: (mapWidth * cols) / 2, height: (mapHeight * rows) / 2 }}
          className={`col-span-${cols} row-span-${rows} relative`}
        >
          <Image
            style={{
              objectFit: 'cover',
              objectPosition: 'center',
            }}
            src={'/img/land/sea.gif'}
            alt={'海'}
            sizes={`${mapWidth}px`}
            fill
            priority
          />
          {num !== undefined && (
            <p
              className="map-overlay font-mono"
              style={{ left: `${left}%`, fontSize: (13 * mapWidth) / baseMapPixel }}
            >
              {num}
            </p>
          )}
        </li>
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
        <ul
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, min-content)',
          }}
        >
          <li style={{ width: mapPixel, height: mapPixel }}>
            <Image
              style={{ outline: '1px solid rgb(125, 125, 125)' }}
              src={src}
              alt={alt}
              width={mapPixel}
              height={mapPixel}
              loading="lazy"
            />
          </li>
          <li className="ml-1">
            <p className="leading-tight">
              {`${islandName}島`}
              <br />
              {mapInfoText}
            </p>
          </li>
        </ul>
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

const ulStyle = (propsStyle: CSSProperties | undefined) => {
  const baseStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${2 * (META.MAP_SIZE + 1)}, min-content)`,
    gridTemplateRows: `repeat(${2 * (META.MAP_SIZE + 1)}, min-content)`,
    gap: 0,
  };
  const uiStyle = { ...propsStyle, ...baseStyle };

  return uiStyle;
};

type HakoniwaMapProps = {
  style?: CSSProperties;
  className?: string;
  isLoading: boolean;
  islandName?: string;
  data?: islandInfoData;
};

/* Mapのピクセルサイズ */
const baseMapPixel = 32;

export default memo(
  function HakoniwaMap({ style, className, isLoading, islandName, data }: HakoniwaMapProps) {
    /* 座標表示用のデータを用意する[0,..,X] */
    const coordinate = Array.from({ length: META.MAP_SIZE }, (_, i) => i);
    const [measured, setMeasured] = useState(false);
    const [mapWidth, setMapWidth] = useState<number>(baseMapPixel);
    const [mapHeight, setMapHeight] = useState<number>(baseMapPixel);

    const ulCallback = (node: HTMLUListElement) => {
      if (node !== null && !measured) {
        const { width, height } = node.getBoundingClientRect();
        setMapWidth(Math.ceil(width / (META.MAP_SIZE + 1)));
        setMapHeight(Math.ceil(height / (META.MAP_SIZE + 0.5)));
        // NOTE: 再計算を防ぐ
        setMeasured(true);
      }
    };

    if (isLoading || !islandName || !data) {
      return <Loading />;
    }

    return (
      <ul style={ulStyle(style)} className={className} ref={ulCallback}>
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
              <li
                style={{
                  margin: 0,
                  padding: 0,
                  boxSizing: 'border-box',
                }}
                className="col-span-2 row-span-2"
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
              </li>
              {x === META.MAP_SIZE - 1 && y % 2 === 1 && (
                <Spacer mapWidth={mapWidth} mapHeight={mapHeight} rows={2} cols={1} />
              )}
            </Fragment>
          );
        })}
      </ul>
    );
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);
