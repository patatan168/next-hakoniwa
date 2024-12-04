import { islandInfoData } from '@/db/schema/islandTable';
import { default as META } from '@/global/define/metadata';
import { css } from '@emotion/react';
import { ImageList, ImageListItem, Tooltip, tooltipClasses, Typography } from '@mui/material';
import Image from 'next/image';
import { memo } from 'react';
import { getMapDefine, getMapImpPath, getMapInfoText, getMapName } from '../define/mapType';

type SpacerProps = {
  mapPixel: number;
  rows: number;
  cols: number;
  num?: number;
  aligin?: 'left' | 'center' | 'right';
};

const Spacer = ({ mapPixel, rows, cols, num, aligin }: SpacerProps) => {
  // aligin
  let left = 50;
  if (aligin === 'left') {
    left = 25;
  } else if (aligin === 'right') {
    left = 75;
  }

  const overlay = css`
    position: relative;
    p {
      position: absolute;
      top: 50%;
      left: ${left}%;
      -ms-transform: translate(-50%, -45%);
      -webkit-transform: translate(-50%, -45%);
      transform: translate(-50%, -45%);
      color: #ffd676;
      font-size: 13px;
      font-weight: 600;
      text-shadow: 2px 1px 1px #653c00;
      margin: 0 !important;
      padding: 0 !important;
      pointer-events: none;
    }
  `;

  return (
    <>
      <ImageListItem css={overlay} rows={rows} cols={cols}>
        <Image
          src={'/img/land/sea.gif'}
          alt={'海'}
          height={(mapPixel * rows) / 2}
          width={(mapPixel * cols) / 2}
          loading="lazy"
        />
        {num !== undefined && <p css={overlay}>{num}</p>}
      </ImageListItem>
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
  const imgLine = css`
    img {
      outline: 1px solid rgb(125, 125, 125);
    }
  `;

  return (
    <>
      <div css={imgLine} style={{ display: 'flex', alignItems: 'center' }}>
        <Image src={src} alt={alt} width={mapPixel} height={mapPixel} loading="lazy" />
        <Typography sx={{ ml: 1 }} variant="body2">
          {`${islandName}島`}
          <br />
          {mapInfoText}
        </Typography>
      </div>
    </>
  );
};

type HakoniwaMapProps = {
  islandName: string;
  data: islandInfoData;
  mapWidth?: number;
};

/* Mapのピクセルサイズ */
const baseMapPixel = 32;

export default memo(function HakoniwaMap({ islandName, data, mapWidth }: HakoniwaMapProps) {
  const mapPixel =
    mapWidth !== undefined && mapWidth > 0 ? mapWidth / (META.MapSize + 1) : baseMapPixel;
  /* 座標表示用のデータを用意する[0,..,X] */
  const coordinate = [];
  for (let i = 0; i < META.MapSize; i++) {
    coordinate.push(i);
  }

  const hoverImgBright = css`
    img:hover {
      filter: brightness(150%) contrast(115%);
    }
  `;

  return (
    <ImageList cols={2 * (META.MapSize + 1)} gap={0}>
      <Spacer mapPixel={mapPixel} rows={1} cols={2} />
      {coordinate.map((x) => (
        <Spacer key={`spacer-${x}`} mapPixel={mapPixel} rows={1} cols={2} num={x} aligin={'left'} />
      ))}
      {data.map(({ x, y, type, landValue }) => {
        const { imgPath, name } = getMapDefine(type);
        const alt = getMapName(type, landValue, name);
        const src = getMapImpPath(type, landValue, imgPath);
        const mapInfoText = getMapInfoText(x, y, type, landValue);
        return (
          <>
            {x === 0 && y % 2 === 0 && (
              <Spacer
                key={`spacer-even-${y}`}
                mapPixel={mapPixel}
                rows={2}
                cols={2}
                num={y}
                aligin={'left'}
              />
            )}
            {x === 0 && y % 2 === 1 && (
              <Spacer key={`spacer-odd-${y}`} mapPixel={mapPixel} rows={2} cols={1} num={y} />
            )}
            <ImageListItem key={`map-${x}-${y}`} css={hoverImgBright} rows={2} cols={2}>
              <Tooltip
                slotProps={{
                  popper: {
                    sx: {
                      [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]:
                        {
                          marginTop: '20px',
                        },
                    },
                  },
                }}
                title={
                  <MapInfoTips
                    islandName={islandName}
                    mapPixel={mapPixel}
                    mapInfoText={mapInfoText}
                    src={src}
                    alt={alt}
                  />
                }
                followCursor
              >
                <Image src={src} alt={alt} width={mapPixel} height={mapPixel} loading="lazy" />
              </Tooltip>
            </ImageListItem>
            {x === META.MapSize - 1 && y % 2 === 1 && (
              <Spacer key={`spacer-herf-${y}`} mapPixel={mapPixel} rows={2} cols={1} />
            )}
          </>
        );
      })}
    </ImageList>
  );
});
