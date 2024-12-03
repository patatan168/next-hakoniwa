import { islandInfoData } from '@/db/schema/islandTable';
import { default as META } from '@/global/define/metadata';
import { css } from '@emotion/react';
import { ImageList, ImageListItem, Tooltip, tooltipClasses, Typography } from '@mui/material';
import Image from 'next/image';
import { memo } from 'react';
import { getMapDefine, getMapImpPath, getMapInfoText, getMapName } from '../define/mapType';

const coordinateArray = () => {
  const result = [];
  for (let i = 0; i < META.MapSize; i++) {
    result.push(i);
  }
  return result;
};

const mapPixel = 32;

type SpacerProps = {
  rows: number;
  cols: number;
  num?: number;
};

const overlay = css`
  position: relative;
  p {
    position: absolute;
    top: 50%;
    left: 50%;
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

const Spacer = ({ rows, cols, num }: SpacerProps) => {
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

type HakoniwaMapProps = {
  islandName: string;
  data: islandInfoData;
};

export default memo(function HakoniwaMap({ islandName, data }: HakoniwaMapProps) {
  const coordinate = coordinateArray();
  return (
    <ImageList cols={2 * META.MapSize + 2} gap={0}>
      <Spacer rows={1} cols={2} />
      {coordinate.map((x) => {
        return (
          <>
            <Spacer rows={1} cols={2} num={x} />
          </>
        );
      })}
      {data.map(({ x, y, type, landValue }) => {
        const { imgPath, name } = getMapDefine(type);
        const alt = getMapName(type, landValue, name);
        const src = getMapImpPath(type, landValue, imgPath);
        return (
          <>
            {x === 0 && y % 2 === 0 && <Spacer rows={2} cols={2} num={y} />}
            {x === 0 && y % 2 === 1 && <Spacer rows={2} cols={1} num={y} />}
            <ImageListItem rows={2} cols={2} key={type}>
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
                  <>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Image src={src} alt={alt} width={32} height={32} loading="lazy" />
                      <Typography sx={{ ml: 1 }} variant="body2">
                        {`${islandName}島`}
                        <br />
                        {getMapInfoText(x, y, type, landValue)}
                      </Typography>
                    </div>
                  </>
                }
                followCursor
              >
                <Image src={src} alt={alt} width={32} height={32} loading="lazy" />
              </Tooltip>
            </ImageListItem>
            {x === META.MapSize - 1 && y % 2 === 1 && <Spacer rows={2} cols={1} />}
          </>
        );
      })}
    </ImageList>
  );
});
