import Box from '@mui/material/Box';
import Tab, { TabOwnProps } from '@mui/material/Tab';
import Tabs, { TabsOwnProps } from '@mui/material/Tabs';
import { CSSProperties, memo } from 'react';

type TabsProp = Omit<TabsOwnProps, 'value' | 'onChange'>;

type BaseTabsProps = {
  style?: CSSProperties;
  /** @see [MUI Tabs](https://mui.com/base-ui/react-tabs/components-api/#tabs) */
  tabsProp?: TabsProp;
  /** @see [MUI Tab](https://mui.com/base-ui/react-tabs/components-api/#tab) */
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
