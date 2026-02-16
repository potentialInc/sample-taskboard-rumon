import { useState, useCallback, useMemo } from 'react';
import { Icon } from '@iconify/react';

// ============================================================
// Column definition
// ============================================================

export interface ColumnDef<T> {
  id: string;
  header: string;
  headerClassName?: string;
  cellClassName?: string;
  render: (row: T, index: number) => React.ReactNode;
}

// ============================================================
// DataTable Props
// ============================================================

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  // Pagination
  page?: number;
  limit?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  showPagination?: boolean;
  entityName?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  selectable = false,
  selectedIds,
  onSelectionChange,
  onRowClick,
  emptyMessage = 'No data found.',
  page = 1,
  limit = 10,
  total = 0,
  onPageChange,
  onLimitChange,
  showPagination = true,
  entityName = 'items',
}: DataTableProps<T>) {
  const allIds = useMemo(() => data.map(keyExtractor), [data, keyExtractor]);
  const allSelected = allIds.length > 0 && selectedIds ? allIds.every((id) => selectedIds.has(id)) : false;

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange || !selectedIds) return;
    if (allSelected) {
      const next = new Set(selectedIds);
      allIds.forEach((id) => next.delete(id));
      onSelectionChange(next);
    } else {
      const next = new Set(selectedIds);
      allIds.forEach((id) => next.add(id));
      onSelectionChange(next);
    }
  }, [allSelected, allIds, selectedIds, onSelectionChange]);

  const handleSelectRow = useCallback(
    (id: string) => {
      if (!onSelectionChange || !selectedIds) return;
      const next = new Set(selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      onSelectionChange(next);
    },
    [selectedIds, onSelectionChange]
  );

  // Pagination calculations
  const totalPages = Math.ceil(total / limit);
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);

  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('ellipsis');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
            <tr>
              {selectable && (
                <th className="px-6 py-3 w-[40px] checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={`px-6 py-3 text-xs font-medium text-[#64748B] uppercase tracking-wider ${col.headerClassName ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-6 py-12 text-center text-sm text-[#64748B]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const id = keyExtractor(row);
                const isSelected = selectedIds?.has(id) ?? false;

                return (
                  <tr
                    key={id}
                    className={`hover:bg-gray-50 transition-colors group ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                    onClick={(e) => {
                      if (!onRowClick) return;
                      const target = e.target as HTMLElement;
                      if (target.closest('.checkbox-wrapper') || target.closest('[data-action-cell]')) return;
                      onRowClick(row);
                    }}
                  >
                    {selectable && (
                      <td className="px-6 py-4 checkbox-wrapper">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(id)}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.id} className={`px-6 py-4 ${col.cellClassName ?? ''}`}>
                        {col.render(row, index)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && total > 0 && (
        <div className="px-6 py-4 border-t border-[#E5E7EB] bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-[#64748B]">
            Showing{' '}
            <span className="font-medium text-[#1E293B]">
              {startItem}-{endItem}
            </span>{' '}
            of <span className="font-medium text-[#1E293B]">{total}</span> {entityName}
          </span>

          <div className="flex items-center gap-3">
            {/* Per page selector */}
            <div className="relative">
              <select
                value={limit}
                onChange={(e) => onLimitChange?.(Number(e.target.value))}
                className="appearance-none pl-3 pr-8 py-1.5 border border-[#E5E7EB] rounded-lg text-sm bg-white text-[#1E293B] focus:outline-none focus:border-[#4A90D9] cursor-pointer"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-[#64748B]">
                <Icon icon="solar:alt-arrow-down-linear" width={12} />
              </div>
            </div>

            {/* Page buttons */}
            <div className="flex items-center border border-[#E5E7EB] rounded-lg overflow-hidden">
              <button
                className="px-3 py-1.5 text-sm text-[#64748B] hover:bg-gray-50 border-r border-[#E5E7EB] disabled:opacity-50 disabled:hover:bg-white"
                disabled={page <= 1}
                onClick={() => onPageChange?.(page - 1)}
              >
                Previous
              </button>
              {pageNumbers.map((p, i) =>
                p === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-2 py-1.5 text-sm text-[#64748B] border-r border-[#E5E7EB]"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    className={`px-3 py-1.5 text-sm border-r border-[#E5E7EB] transition-colors ${
                      p === page
                        ? 'bg-[#4A90D9] text-white font-medium'
                        : 'text-[#64748B] hover:bg-gray-50 hover:text-[#1E293B]'
                    }`}
                    onClick={() => onPageChange?.(p as number)}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                className="px-3 py-1.5 text-sm text-[#64748B] hover:bg-gray-50 hover:text-[#1E293B] transition-colors"
                disabled={page >= totalPages}
                onClick={() => onPageChange?.(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
