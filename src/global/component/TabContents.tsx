import Box from '@mui/material/Box';
import Tab, { TabOwnProps } from '@mui/material/Tab';
import Tabs, { TabsOwnProps } from '@mui/material/Tabs';
import { CSSProperties, memo } from 'react';

type TabsProp = Omit<TabsOwnProps, 'value' | 'onChange'>;

type BaseTabsProps = {
  style?: CSSProperties;
  tabsProp?: TabsProp;
  tabContents: Array<TabOwnProps>;
  value: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (event: React.SyntheticEvent, value: any) => void;
};

export default memo(function BaseTabs({
  style,
  tabsProp,
  tabContents,
  value,
  onChange,
}: BaseTabsProps) {
  return (
    <Box style={style}>
      <Tabs value={value} onChange={onChange} {...tabsProp}>
        {tabContents.map((tabContent) => {
          return <Tab key={tabContent.value} {...tabContent} />;
        })}
      </Tabs>
    </Box>
  );
});
