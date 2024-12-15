import { islandInfoData } from '@/db/schema/islandTable';
import { default as META } from '@/global/define/metadata';
import Image from 'next/image';
import { Fragment, memo } from 'react';
import { getMapDefine, getMapImpPath, getMapInfoText, getMapName } from '../define/mapType';
import Loading from './Loading';
import Tooltip from './Tooltip';

type SpacerProps = {
  mapPixel: number;
  rows: number;
  cols: number;
  num?: number;
  algin?: 'left' | 'center' | 'right';
};

const Spacer = ({ mapPixel, rows, cols, num, algin }: SpacerProps) => {
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
        style={{ width: (mapPixel * cols) / 2, height: (mapPixel * rows) / 2 }}
        className={`col-span-${cols} row-span-${rows} relative`}
      >
        <Image
          style={{ aspectRatio: `${cols}/${rows}` }}
          src={'/img/land/sea.gif'}
          alt={'海'}
          height={(mapPixel * rows) / 2}
          width={(mapPixel * cols) / 2}
          priority
        />
        {num !== undefined && (
          <p
            className="map-overlay"
            style={{ left: `${left}%`, fontSize: (13 * mapPixel) / baseMapPixel }}
          >
            {num}
          </p>
        )}
      </li>
    </>
  );
};

type mapInfoTipsProps = {
  islandName: string;
  mapPixel: number;
  mapInfoText: string;
  src: string;
  alt: string;
};
const MapInfoTips = ({ islandName, mapPixel, mapInfoText, src, alt }: mapInfoTipsProps) => {
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
};

const getToolTipPosition = (x: number, y: number) => {
  const topBottom = y === META.MapSize - 1 ? 'top-' : y === 0 ? 'bottom-' : '';
  if (x < META.MapSize / 3) {
    return `${topBottom}right`;
  } else if (x > (2 * META.MapSize) / 3) {
    return `${topBottom}left`;
  } else {
    return y < META.MapSize / 2 ? 'bottom' : 'top';
  }
};

type HakoniwaMapProps = {
  isLoading: boolean;
  islandName: string;
  data: islandInfoData;
  mapWidth?: number;
};

/* Mapのピクセルサイズ */
const baseMapPixel = 32;

export default memo(function HakoniwaMap({
  isLoading,
  islandName,
  data,
  mapWidth,
}: HakoniwaMapProps) {
  const mapPixel =
    mapWidth !== undefined && mapWidth > 0 ? mapWidth / (META.MapSize + 1) : baseMapPixel;
  /* 座標表示用のデータを用意する[0,..,X] */
  const coordinate = [];
  for (let i = 0; i < META.MapSize; i++) {
    coordinate.push(i);
  }

  return isLoading ? (
    <Loading />
  ) : (
    <ul
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${2 * (META.MapSize + 1)}, min-content)`,
      }}
    >
      <Spacer mapPixel={mapPixel} rows={1} cols={2} />
      {coordinate.map((x) => (
        <Spacer key={`spacer-${x}`} mapPixel={mapPixel} rows={1} cols={2} num={x} algin={'left'} />
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
              <Spacer mapPixel={mapPixel} rows={2} cols={2} num={y} algin={'left'} />
            )}
            {x === 0 && y % 2 === 1 && <Spacer mapPixel={mapPixel} rows={2} cols={1} num={y} />}
            <li style={{ width: mapPixel, height: mapPixel }} className="col-span-2 row-span-2">
              <Tooltip
                position={tooltipPosition}
                tooltipComp={
                  <MapInfoTips
                    islandName={islandName}
                    mapPixel={mapPixel}
                    mapInfoText={mapInfoText}
                    src={src}
                    alt={alt}
                  />
                }
              >
                <Image
                  className="hover:contrast-115 hover:brightness-150"
                  src={src}
                  alt={alt}
                  width={mapPixel}
                  height={mapPixel}
                  loading="lazy"
                />
              </Tooltip>
            </li>
            {x === META.MapSize - 1 && y % 2 === 1 && (
              <Spacer mapPixel={mapPixel} rows={2} cols={1} />
            )}
          </Fragment>
        );
      })}
    </ul>
  );
});
