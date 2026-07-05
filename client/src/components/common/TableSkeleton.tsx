import type { FC } from "react";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

const TableSkeleton: FC<TableSkeletonProps> = ({ rows = 6, columns = 5 }) => (
  <div className="animate-pulse">
    {Array.from({ length: rows }).map((_, r) => (
      <div
        key={r}
        className="flex items-center gap-4 sm:gap-6 px-4 sm:px-6 py-4 border-b border-gray-100"
      >
        {Array.from({ length: columns }).map((_, c) => (
          <div key={c} className="h-3.5 sm:h-4 bg-gray-200 rounded flex-1 min-w-0" />
        ))}
      </div>
    ))}
  </div>
);

export default TableSkeleton;