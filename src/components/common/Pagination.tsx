import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage?: number;
  page?: number;
  totalPages: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  page,
  totalPages,
  pageSize = 10,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className = "",
}) => {
  const resolvedCurrentPage = currentPage ?? page ?? 1;
  const resolvedTotalItems = totalItems || Math.max(totalPages, 1) * pageSize;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let startPage = Math.max(2, resolvedCurrentPage - 1);
      let endPage = Math.min(totalPages - 1, resolvedCurrentPage + 1);

      if (resolvedCurrentPage <= 2) {
        endPage = 4;
      } else if (resolvedCurrentPage >= totalPages - 1) {
        startPage = totalPages - 3;
      }

      if (startPage > 2) {
        pages.push("...");
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages - 1) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const startItem = (resolvedCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(resolvedCurrentPage * pageSize, resolvedTotalItems);

  if (resolvedTotalItems === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-3 py-4 w-full min-w-0 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-gray-600 min-w-0">
        <span className="whitespace-nowrap">
          Showing <span className="font-medium">{startItem}</span>-
          <span className="font-medium">{endItem}</span> of{" "}
          <span className="font-medium">{resolvedTotalItems}</span>
        </span>
        {onPageSizeChange && (
          <span className="flex items-center gap-1 whitespace-nowrap">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
              className="ml-1 px-2 py-1 border border-gray-300 rounded text-sm"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>per page</span>
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1 sm:gap-2 min-w-0">
        <button
          onClick={() => onPageChange(resolvedCurrentPage - 1)}
          disabled={resolvedCurrentPage === 1}
          className="inline-flex shrink-0 items-center justify-center w-8 h-8 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex flex-wrap items-center gap-1 min-w-0">
          {getPageNumbers().map((pageNumber, index) => (
            <React.Fragment key={index}>
              {pageNumber === "..." ? (
                <span className="px-2 py-1 text-gray-600 shrink-0">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(pageNumber as number)}
                  className={`shrink-0 w-8 h-8 rounded border transition-colors ${
                    pageNumber === resolvedCurrentPage
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {pageNumber}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          onClick={() => onPageChange(resolvedCurrentPage + 1)}
          disabled={resolvedCurrentPage === totalPages}
          className="inline-flex shrink-0 items-center justify-center w-8 h-8 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
