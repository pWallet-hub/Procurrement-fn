import type { ReactNode, TableHTMLAttributes } from 'react';
import { cx } from './cx';
import { EmptyState } from './EmptyState';

/** Plain styled table inside a scroll wrapper. className hooks: .table-wrap .table */
export function Table({ className, children, ...rest }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="table-wrap">
      <table className={cx('table', className)} {...rest}>
        {children}
      </table>
    </div>
  );
}

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
}

/** Convenience data table. Rows are clickable (and keyboard operable) when onRowClick is given. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty = 'Nothing to show.',
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: string;
}) {
  if (rows.length === 0) return <EmptyState title={empty} />;
  return (
    <Table>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.header} scope="col">
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={rowKey(r)}
            className={cx(onRowClick && 'is-clickable')}
            onClick={onRowClick ? () => onRowClick(r) : undefined}
          >
            {columns.map((c) => (
              <td key={c.header}>{c.cell(r)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
