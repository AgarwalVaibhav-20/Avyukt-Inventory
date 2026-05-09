import { useEffect, useMemo, useState } from "react";

interface UseListControlsOptions<T> {
  items: T[];
  initialPageSize?: number;
  searchTerm?: string;
  filters?: Record<string, any>;
  searchFn?: (item: T, searchTerm: string) => boolean;
  filterFn?: (item: T, filters: Record<string, any>) => boolean;
}

export const useListControls = <T,>({
  items,
  initialPageSize = 10,
  searchTerm = "",
  filters = {},
  searchFn,
  filterFn,
}: UseListControlsOptions<T>) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const controlledItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        (searchFn
          ? searchFn(item, normalizedSearch)
          : Object.values(item as Record<string, any>).some((value) =>
              String(value || "").toLowerCase().includes(normalizedSearch),
            ));

      const matchesFilters = filterFn ? filterFn(item, filters) : true;

      return matchesSearch && matchesFilters;
    });
  }, [items, searchTerm, filters, searchFn, filterFn]);

  const totalItems = controlledItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filters, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return controlledItems.slice(start, start + pageSize);
  }, [controlledItems, page, pageSize]);

  return {
    filteredItems: controlledItems,
    pagedItems,
    page,
    pageSize,
    totalItems,
    totalPages,
    setPage,
    setPageSize,
  };
};
