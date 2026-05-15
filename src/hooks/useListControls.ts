import { useEffect, useMemo, useState } from "react";

interface UseListControlsOptions<T> {
  items: T[];
  initialPageSize?: number;
  searchTerm?: string;
  filters?: Record<string, any>;
  searchFn?: (item: T, searchTerm: string) => boolean;
  filterFn?: (item: T, filters: Record<string, any>) => boolean;
  sortFn?: (a: T, b: T, sortOrder: "newest" | "earliest") => number;
}

export const useListControls = <T,>({
  items,
  initialPageSize = 10,
  searchTerm = "",
  filters = {},
  searchFn,
  filterFn,
  sortFn,
}: UseListControlsOptions<T>) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortOrder, setSortOrder] = useState<"newest" | "earliest">("newest");
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  const getComparableDate = (item: T) => {
    const record = item as Record<string, any>;
    const candidates = [
      record.date && record.timestamp ? `${record.date} ${record.timestamp}` : undefined,
      record.createdAt,
      record.updatedAt,
      record.lastUpdated,
      record.uploadDate,
      record.generatedDate,
      record.date,
      record.dueDate,
      record.requiredDate,
      record.expiryDate,
      record.timestamp,
    ];

    for (const value of candidates) {
      if (!value) continue;
      const time = new Date(value).getTime();
      if (!Number.isNaN(time)) return time;
    }

    return 0;
  };

  const controlledItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = items.filter((item) => {
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

    const activeSortOrder = filters.sortOrder as "newest" | "earliest" | undefined;
    const listSortOrder = activeSortOrder || sortOrder;
    if (listSortOrder !== "newest" && listSortOrder !== "earliest") return filtered;

    return [...filtered].sort((a, b) => {
      if (sortFn) return sortFn(a, b, listSortOrder);

      const left = getComparableDate(a);
      const right = getComparableDate(b);
      return listSortOrder === "newest" ? right - left : left - right;
    });
  }, [items, searchTerm, filtersKey, searchFn, filterFn, sortFn, sortOrder]);

  const totalItems = controlledItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filtersKey, pageSize]);

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
    sortOrder,
    setSortOrder,
  };
};
