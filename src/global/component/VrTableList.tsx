import { CSSProperties, memo, Ref } from 'react';
import { TableComponents, TableVirtuoso } from 'react-virtuoso';
import { Card } from './Card';

const VirtuosoTableComponents: TableComponents<object, ColumnInfo> = {
  Table: (props) => <table {...props} className="w-full table-fixed break-all border" />,
  TableHead: function _TableHead(props) {
    return <thead {...props} className="bg-green-200 text-red-600" />;
  },
  TableRow: function _TableRow(props) {
    return <tr {...props} className="bg-green-50" />;
  },
};

function headerContent(columnHeader: ColumnInfo) {
  return (
    <tr>
      {columnHeader.map((column) => (
        <th
          className="border-2 border-green-400 p-3"
          key={column.key}
          style={{ width: column.width, ...column.headStyle }}
        >
          {column.headName}
        </th>
      ))}
    </tr>
  );
}

function rowContent(_index: number, row: object, columnHeader: ColumnInfo) {
  return (
    <>
      {columnHeader.map((column) => {
        return (
          <td
            className="border-2 border-green-400/50 px-3 py-4"
            key={column.key}
            style={column.dataStyle}
          >
            {row[column.key as keyof object]}
          </td>
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

type VrTableListProps = {
  ref?: Ref<HTMLDivElement>;
  isLoading?: boolean;
  style?: CSSProperties | undefined;
  columnHeader: ColumnInfo;
  data?: Array<object>;
};

export default memo(function HakoniwaMap(props: VrTableListProps) {
  const { isLoading, style, columnHeader, data, ref } = props;
  const fixedHeaderContent = (columnHeader: ColumnInfo) => {
    return () => headerContent(columnHeader);
  };
  const itemContent = (columnHeader: ColumnInfo) => {
    return (_index: number, row: object) => rowContent(_index, row, columnHeader);
  };

  return !isLoading || isLoading === undefined ? (
    <Card ref={ref} style={style}>
      <TableVirtuoso
        data={data}
        components={VirtuosoTableComponents}
        fixedHeaderContent={fixedHeaderContent(columnHeader)}
        itemContent={itemContent(columnHeader)}
      />
    </Card>
  ) : (
    <>
      <div className="mt-3 flex justify-center pb-3" aria-label="読み込み中">
        <div className="size-2 animate-ping rounded-full bg-green-600"></div>
        <div className="mx-4 size-2 animate-ping rounded-full bg-green-600"></div>
        <div className="size-2 animate-ping rounded-full bg-green-600"></div>
      </div>
    </>
  );
});
