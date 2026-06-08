import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchStockControlData,
  updateReorderLevelRecord,
} from "@/store/slices/stockControlSlice";
import { InventoryItem } from "@/types";
import {
  BarChart3,
  Save,
  Search,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchItems, updateInventoryItem } from "@/store/slices/inventorySlice";
import Pagination from "@/components/common/Pagination";
import { useListControls } from "@/hooks/useListControls";

const ReorderLevelView: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { items, loading, error } = useAppSelector((state) => state.inventory);
  const { actionLoading } = useAppSelector((state) => state.stockControl);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLevel, setEditLevel] = useState<number>(0);

  useEffect(() => {
    dispatch(fetchItems());
  }, [dispatch]);

  useEffect(() => {
    const sku = searchParams.get("sku");
    if (sku) setSearch(sku);
  }, [searchParams]);

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditLevel(item.reorderLevel);
  };

  const handleSave = async (id: string) => {
    await dispatch(
      updateInventoryItem({ id, updates: { reorderLevel: editLevel, minimumStockLevel: editLevel } }),
    );
    setEditingId(null);
  };

  const {
    filteredItems,
    pagedItems,
    page,
    pageSize,
    totalItems,
    totalPages,
    setPage,
    setPageSize,
  } = useListControls({
    items,
    searchTerm: search,
    filters: { stock: stockFilter },
    initialPageSize: 10,
    searchFn: (item, term) =>
      item.name.toLowerCase().includes(term) ||
      item.sku.toLowerCase().includes(term),
    filterFn: (item, filters) => {
      if (filters.stock === "low") return item.stock <= item.reorderLevel && item.stock > 0;
      if (filters.stock === "out") return item.stock === 0;
      if (filters.stock === "healthy") return item.stock > item.reorderLevel;
      return true;
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={20} /> Reorder Levels &
            Safety Stock
          </h2>
          <div className="flex gap-3">
            <div className="relative w-64">
              <Search
                className="absolute left-3 top-2.5 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search Item..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-40 px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="">All stock</option>
              <option value="healthy">Healthy</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4 text-center">Current Stock</th>
                <th className="px-6 py-4 text-center">Reorder Level</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <Loader2 className="animate-spin-slow inline mr-2" /> Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No items found.
                  </td>
                </tr>
              ) : (
                pagedItems.map((item) => {
                  const isEditing = editingId === item.id;
                  const isLow = item.stock <= item.reorderLevel;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500">{item.sku}</p>
                      </td>

                      <td className="px-6 py-4 text-center font-medium">
                        {item.stock} {item.uom}
                      </td>

                      <td className="px-6 py-4 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            className="w-20 border border-blue-300 rounded px-2 py-1 text-center"
                            value={editLevel}
                            onChange={(e) =>
                              setEditLevel(Number(e.target.value))
                            }
                          />
                        ) : (
                          <span className="text-slate-600">
                            {item.reorderLevel}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            isLow
                              ? "bg-red-50 text-red-700 border-red-100"
                              : "bg-green-50 text-green-700 border-green-100"
                          }`}
                        >
                          {isLow ? (
                            <AlertTriangle size={12} />
                          ) : (
                            <CheckCircle size={12} />
                          )}
                          {isLow
                            ? item.stock === 0
                              ? "Out of Stock"
                              : "Low Stock"
                            : "Healthy"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleSave(item.id)}
                              disabled={actionLoading}
                              className="text-green-600 hover:bg-green-50 p-1 rounded disabled:opacity-60"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-slate-400 hover:bg-slate-100 p-1 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Update Level
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
};

export default ReorderLevelView;
