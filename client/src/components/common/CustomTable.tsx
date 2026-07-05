import { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import Loader from './Loader';

export type SortOrder = 'asc' | 'desc';

interface CustomTableProps<T> {
  /** The data to render — one row per item */
  list: T[];
  /** Returns a unique key for a given row item */
  itemKey: (item: T) => string | number;
  /** Column order + header labels, e.g. { NAME: 'Name', EMAIL: 'Email' } */
  columns: Record<string, string>;
  /** Which column keys (from `columns`) should render as clickable sort headers */
  sortableColumns?: string[];
  /** Called when a sortable header is clicked. Parent owns what "sorted" means. */
  onSort?: (sortBy: string, sortOrder: SortOrder) => void;
  /** Returns cell content for a row, keyed the same way as `columns` */
  renderRow: (item: T) => Record<string, React.ReactNode>;
  /** Optional trailing "Actions" column per row */
  renderAction?: (item: T) => React.ReactNode;
  /** True while the next page is being fetched */
  hasMore: boolean;
  /** Called by InfiniteScroll when the user scrolls near the bottom of the page */
  next: () => void;
  /** Full-area loading state — first load, before any rows exist */
  loader?: boolean;
  /** Small loading indicator shown at the bottom while fetching more rows */
  scrollLoader?: boolean;
  /** Message shown in place of the table when `list` is empty and not loading */
  noDataMessage?: React.ReactNode;
}

export function CustomTable<T>({
  list,
  itemKey,
  columns,
  sortableColumns = [],
  onSort,
  renderRow,
  renderAction,
  hasMore,
  next,
  loader = false,
  scrollLoader = false,
  noDataMessage = 'No data found',
}: CustomTableProps<T>) {
  const columnKeys = Object.keys(columns);

  const [activeSortBy, setActiveSortBy] = useState<string | null>(null);
  const [activeSortOrder, setActiveSortOrder] = useState<SortOrder>('asc');

  const handleHeaderClick = (key: string) => {
    if (!sortableColumns.includes(key) || !onSort) return;

    const nextOrder: SortOrder =
      activeSortBy === key && activeSortOrder === 'asc' ? 'desc' : 'asc';

    setActiveSortBy(key);
    setActiveSortOrder(nextOrder);
    onSort(key, nextOrder);
  };

  if (loader) {
    return (
        <Loader />
    );
  }

  if (list.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        {noDataMessage}
      </div>
    );
  }

  return (
    // No fixed height / overflow-y here anymore — the table grows with its content
    // and the page itself scrolls. InfiniteScroll (no scrollableTarget passed) defaults
    // to listening on window scroll, so next() fires as the user nears the bottom
    // of the page, not the bottom of a small internal box.
    <div className="border border-gray-200 rounded-lg overflow-x-auto">
      <InfiniteScroll
        dataLength={list.length}
        next={next}
        hasMore={hasMore}
        loader={
          scrollLoader ? (
            <div className="text-center py-3 text-sm text-gray-500">
              Loading more...
            </div>
          ) : null
        }
      >
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
            <tr>
              {columnKeys.map((key) => {
                const isSortable = sortableColumns.includes(key);
                const isActive = activeSortBy === key;

                return (
                  <th
                    key={key}
                    onClick={() => handleHeaderClick(key)}
                    className={`text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap ${
                      isSortable ? 'cursor-pointer select-none' : ''
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {columns[key]}
                      {isSortable && (
                        <span className="text-gray-400">
                          {isActive ? (activeSortOrder === 'asc' ? '▲' : '▼') : '⇅'}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
              {renderAction && (
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {list.map((item) => {
              const row = renderRow(item);
              return (
                <tr
                  key={itemKey(item)}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  {columnKeys.map((key) => (
                    <td key={key} className="px-4 py-3 align-top">
                      {row[key] ?? '--'}
                    </td>
                  ))}
                  {renderAction && (
                    <td className="px-4 py-3 align-top">{renderAction(item)}</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </InfiniteScroll>
    </div>
  );
}