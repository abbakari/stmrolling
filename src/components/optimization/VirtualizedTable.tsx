import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { FixedSizeGrid as Grid } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

interface Column {
  key: string;
  title: string;
  width: number;
  render?: (value: any, record: any, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
}

interface VirtualizedTableProps {
  data: any[];
  columns: Column[];
  height: number;
  rowHeight?: number;
  hasNextPage?: boolean;
  isNextPageLoading?: boolean;
  loadNextPage?: () => Promise<void>;
  onRowClick?: (record: any, index: number) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

// Memoized row component for performance
const VirtualRow = React.memo(({ index, style, data }: any) => {
  const { items, columns, onRowClick, sortColumn, sortDirection } = data;
  const item = items[index];

  if (!item) {
    return (
      <div style={style} className="flex items-center justify-center">
        <div className="animate-pulse flex space-x-4 w-full p-2">
          {columns.map((col: Column, colIndex: number) => (
            <div
              key={colIndex}
              className="bg-gray-200 h-4 rounded"
              style={{ width: col.width }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={style}
      className={`flex border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
        index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
      }`}
      onClick={() => onRowClick?.(item, index)}
    >
      {columns.map((column: Column, colIndex: number) => (
        <div
          key={column.key}
          className="px-4 py-2 text-sm flex items-center overflow-hidden"
          style={{ width: column.width, minWidth: column.width }}
        >
          {column.render
            ? column.render(item[column.key], item, index)
            : String(item[column.key] || '')}
        </div>
      ))}
    </div>
  );
});

// Memoized header component
const TableHeader = React.memo(({ columns, onSort, sortColumn, sortDirection }: any) => (
  <div className="flex bg-gray-50 border-b-2 border-gray-200 sticky top-0 z-10">
    {columns.map((column: Column) => (
      <div
        key={column.key}
        className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center ${
          column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
        }`}
        style={{ width: column.width, minWidth: column.width }}
        onClick={() => column.sortable && onSort?.(column.key, 
          sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc'
        )}
      >
        <span className="truncate">{column.title}</span>
        {column.sortable && (
          <span className="ml-1">
            {sortColumn === column.key ? (
              sortDirection === 'asc' ? '↑' : '↓'
            ) : (
              '↕'
            )}
          </span>
        )}
      </div>
    ))}
  </div>
));

const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  data,
  columns,
  height,
  rowHeight = 60,
  hasNextPage = false,
  isNextPageLoading = false,
  loadNextPage,
  onRowClick,
  onSort,
  sortColumn,
  sortDirection,
  loading = false,
  emptyMessage = 'No data available',
  className = ''
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate total width
  const totalWidth = useMemo(() => 
    columns.reduce((sum, col) => sum + col.width, 0), [columns]
  );

  // Resize observer for responsive behavior
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Infinite loader configuration
  const itemCount = hasNextPage ? data.length + 1 : data.length;
  const isItemLoaded = useCallback((index: number) => !!data[index], [data]);

  const loadMoreItems = useCallback(async () => {
    if (isNextPageLoading || !loadNextPage) return;
    await loadNextPage();
  }, [isNextPageLoading, loadNextPage]);

  // Row renderer with infinite loading
  const Row = useCallback(({ index, style }: any) => {
    if (index >= data.length) {
      return (
        <div style={style} className="flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      );
    }

    return (
      <VirtualRow
        index={index}
        style={style}
        data={{ items: data, columns, onRowClick, sortColumn, sortDirection }}
      />
    );
  }, [data, columns, onRowClick, sortColumn, sortDirection]);

  if (loading && data.length === 0) {
    return (
      <div className={`${className} border border-gray-200 rounded-lg`} style={{ height }}>
        <TableHeader columns={columns} onSort={onSort} sortColumn={sortColumn} sortDirection={sortDirection} />
        <div className="flex items-center justify-center" style={{ height: height - 60 }}>
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (data.length === 0 && !loading) {
    return (
      <div className={`${className} border border-gray-200 rounded-lg`} style={{ height }}>
        <TableHeader columns={columns} onSort={onSort} sortColumn={sortColumn} sortDirection={sortDirection} />
        <div className="flex items-center justify-center" style={{ height: height - 60 }}>
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`${className} border border-gray-200 rounded-lg overflow-hidden`}>
      <TableHeader 
        columns={columns} 
        onSort={onSort} 
        sortColumn={sortColumn} 
        sortDirection={sortDirection} 
      />
      
      <div style={{ height: height - 60 }}>
        {loadNextPage ? (
          <InfiniteLoader
            isItemLoaded={isItemLoaded}
            itemCount={itemCount}
            loadMoreItems={loadMoreItems}
          >
            {({ onItemsRendered, ref }) => (
              <List
                ref={ref}
                height={height - 60}
                itemCount={itemCount}
                itemSize={rowHeight}
                onItemsRendered={onItemsRendered}
                width={Math.max(totalWidth, containerWidth)}
              >
                {Row}
              </List>
            )}
          </InfiniteLoader>
        ) : (
          <List
            height={height - 60}
            itemCount={data.length}
            itemSize={rowHeight}
            width={Math.max(totalWidth, containerWidth)}
          >
            {Row}
          </List>
        )}
      </div>
    </div>
  );
};

export default VirtualizedTable;

// Grid version for more complex layouts
export const VirtualizedGrid: React.FC<{
  data: any[][];
  columnCount: number;
  rowCount: number;
  columnWidth: number;
  rowHeight: number;
  height: number;
  width: number;
  renderCell: (props: { columnIndex: number; rowIndex: number; style: any }) => React.ReactNode;
  className?: string;
}> = ({
  data,
  columnCount,
  rowCount,
  columnWidth,
  rowHeight,
  height,
  width,
  renderCell,
  className = ''
}) => {
  return (
    <div className={`${className} border border-gray-200 rounded-lg overflow-hidden`}>
      <Grid
        columnCount={columnCount}
        columnWidth={columnWidth}
        height={height}
        rowCount={rowCount}
        rowHeight={rowHeight}
        width={width}
      >
        {renderCell}
      </Grid>
    </div>
  );
};

// Performance monitoring hook
export const useTablePerformance = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    itemsRendered: 0,
    memoryUsage: 0
  });

  const startTiming = useRef<number>(0);

  const startRender = useCallback(() => {
    startTiming.current = performance.now();
  }, []);

  const endRender = useCallback((itemCount: number) => {
    const renderTime = performance.now() - startTiming.current;
    
    // Estimate memory usage (rough calculation)
    const memoryUsage = (performance as any).memory 
      ? (performance as any).memory.usedJSHeapSize / 1024 / 1024 
      : 0;

    setMetrics({
      renderTime,
      itemsRendered: itemCount,
      memoryUsage
    });
  }, []);

  return { metrics, startRender, endRender };
};
