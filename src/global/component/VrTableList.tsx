import { isEqual } from 'es-toolkit';
import { CSSProperties, memo, Ref } from 'react';
import { TableComponents, TableVirtuoso } from 'react-virtuoso';
import { Card } from './Card';
import Loading from './Loading';

const VirtuosoTableComponents: TableComponents<object, ColumnInfo> = {
  Table: (props) => <table {...props} className="w-full table-fixed border break-all" />,
  TableHead: function _TableHead(props) {
    return (
      <thead
        {...props}
        className="[&_th]:border-2 [&_th]:border-green-400 [&_th]:bg-green-200 [&_th]:p-3 [&_th]:text-red-700"
      />
    );
  },
  TableBody: function _TableBody(props) {
    return (
      <tbody
        {...props}
        className="[&_td]:border-2 [&_td]:border-green-400/50 [&_td]:bg-green-50 [&_td]:px-3 [&_td]:py-4"
      />
    );
  },
  TableRow: function _TableRow(props) {
    return <tr {...props} />;
  },
};

function headerContent(columnHeader: ColumnInfo) {
  return (
    <tr>
      {columnHeader.map((column) => (
        <th key={column.key} style={{ width: column.width, ...column.headStyle }}>
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
          <td key={column.key} style={column.dataStyle}>
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

export default memo(
  function VrTableList(props: VrTableListProps) {
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
      <Loading />
    );
  },
  (oldProps, newProps) => isEqual(oldProps, newProps)
);
