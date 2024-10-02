import { LinearProgress, Typography } from '@mui/material';
import Paper, { PaperProps } from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { CSSProperties, forwardRef, memo } from 'react';
import { TableComponents, TableVirtuoso } from 'react-virtuoso';

const VirtuosoTableComponents: TableComponents<object, ColumnInfo> = {
  Scroller: forwardRef<HTMLDivElement>(function _Scroller(props, ref) {
    return <TableContainer component={Paper} {...props} ref={ref} />;
  }),
  Table: (props) => <Table {...props} />,
  TableHead: forwardRef<HTMLTableSectionElement>(function _TableHead(props, ref) {
    return <TableHead {...props} ref={ref} />;
  }),
  TableRow,
  TableBody: forwardRef<HTMLTableSectionElement>(function _TableBody(props, ref) {
    return <TableBody {...props} ref={ref} />;
  }),
};

function headerContent(columnHeader: ColumnInfo) {
  return (
    <TableRow>
      {columnHeader.map((column) => (
        <TableCell
          key={column.key}
          variant="head"
          style={{ width: column.width, ...column.headStyle }}
        >
          {column.headName}
        </TableCell>
      ))}
    </TableRow>
  );
}

function rowContent(_index: number, row: object, columnHeader: ColumnInfo) {
  return (
    <>
      {columnHeader.map((column) => {
        return (
          <TableCell key={column.key} style={column.dataStyle}>
            {row[column.key as keyof object]}
          </TableCell>
        );
      })}
    </>
  );
}

interface Column {
  width: number;
  headName: string;
  key: string;
  headStyle?: CSSProperties | undefined;
  dataStyle?: CSSProperties | undefined;
}

export type ColumnInfo = Array<Column>;

type VrTableListProps = Omit<PaperProps, 'ref'> & {
  isLoading?: boolean;
  style?: CSSProperties | undefined;
  columnHeader: ColumnInfo;
  data?: Array<object>;
};

const VrTableList = memo(
  forwardRef<HTMLDivElement, VrTableListProps>((props, ref) => {
    const { isLoading, style, columnHeader, data } = props;
    const fixedHeaderContent = (columnHeader: ColumnInfo) => {
      return () => headerContent(columnHeader);
    };
    const itemContent = (columnHeader: ColumnInfo) => {
      return (_index: number, row: object) => rowContent(_index, row, columnHeader);
    };

    return !isLoading || isLoading === undefined ? (
      <Paper sx={{ mr: 2 }} ref={ref} style={style} variant="outlined">
        <TableVirtuoso
          data={data}
          components={VirtuosoTableComponents}
          fixedHeaderContent={fixedHeaderContent(columnHeader)}
          itemContent={itemContent(columnHeader)}
        />
      </Paper>
    ) : (
      <>
        <Typography style={{ textAlign: 'center' }}>Loading</Typography>
        <LinearProgress sx={{ mt: 2, mr: 2 }} />
      </>
    );
  })
);

export default VrTableList;
