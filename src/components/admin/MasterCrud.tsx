import React, { useState, useEffect } from "react";
import { Plus, Trash2, Search, Save, X, Loader2 } from "lucide-react";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import Pagination from "@/components/common/Pagination";
import { useListControls } from "@/hooks/useListControls";
import {
  fetchMasterData,
  addMasterData,
  updateMasterData,
  deleteMasterData,
} from "@/store/slices/masterSlice";
import { Edit2, Filter } from "lucide-react";
import { toast } from "react-hot-toast";
import FilterPanel, { FilterField } from "@/components/common/FilterPanel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ColumnDef {
  key: string;
  label: string;
  type?: "text" | "number" | "array" | "select";
  options?: string[];
  optional?: boolean;
}

interface MasterCrudProps {
  title: string;
  description: string;
  columns: ColumnDef[];
  type?: string; // e.g. 'category', 'uom', 'brand', 'hsn'
  fetchData?: (orgId?: string) => Promise<any[]>;
  addData?: (data: any) => Promise<any>;
  updateData?: (id: string, data: any) => Promise<any>;
  deleteData?: (id: string) => Promise<void>;
  filterFields?: FilterField[];
}

const MasterCrud: React.FC<MasterCrudProps> = ({
  title,
  description,
  columns,
  type,
  fetchData,
  addData,
  updateData,
  deleteData,
  filterFields = [],
}) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { data: reduxData, loading: reduxLoading } = useAppSelector(
    (state) => state.master,
  );

  const [localData, setLocalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newData, setNewData] = useState<any>({});
  const [editDataForm, setEditDataForm] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const organisationId =
    user?.organisationId || localStorage.getItem("organisationId");

  const data = type && Array.isArray(reduxData[type])
    ? reduxData[type]
    : Array.isArray(localData)
      ? localData
      : [];
  const isLoading = loading || reduxLoading;

  const loadData = async (searchVal = debouncedSearch) => {
    if (!organisationId) return;

    if (type && !fetchData) {
      dispatch(
        fetchMasterData({ type, organisationId, search: searchVal, filters }),
      );
    } else if (fetchData) {
      setLoading(true);
      try {
        const result = await fetchData(organisationId);
        console.log("Loaded data:", result);
        setLocalData(result);
      } catch (error) {
        console.error("Failed to load data", error);
        toast.error(
          `Failed to load data: ${(error as any)?.message || "Unknown error"}`,
        );
      } finally {
        setLoading(false);
      }
    }
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load data when type, orgId, debouncedSearch or filters change
  useEffect(() => {
    loadData(debouncedSearch);
    setIsAdding(false);
    setNewData({});
  }, [type, organisationId, debouncedSearch, filters]);

  const handleSave = async () => {
    // Basic validation
    for (const col of columns) {
      if (!col.optional && !newData[col.key]) {
        toast.error(`${col.label} is required`);
        return;
      }
    }

    // Duplicate check (case-insensitive)
    const duplicate = data.find((item: any) => {
      // Check common name/code fields for duplicates
      const keysToCompare = ["name", "hsnCode", "code", "uomName"];
      return keysToCompare.some((key) => {
        if (newData[key] && item[key]) {
          return (
            item[key].toString().toLowerCase() ===
            newData[key].toString().toLowerCase()
          );
        }
        return false;
      });
    });

    if (duplicate) {
      toast.error("this name already exist");
      return;
    }

    // Format array types if needed
    const formattedData = { ...newData };
    if (organisationId) {
      formattedData.organisationId = organisationId;
    }

    columns.forEach((col) => {
      if (col.type === "array" && typeof formattedData[col.key] === "string") {
        formattedData[col.key] = formattedData[col.key]
          .split(",")
          .map((s: string) => s.trim());
      }
    });

    try {
      if (type && !addData && type) {
        await dispatch(addMasterData({ ...formattedData, type })).unwrap();
      } else if (addData) {
        console.log("Saving data:", formattedData);
        await addData(formattedData);
        await loadData();
      }
      setIsAdding(false);
      setNewData({});
      console.log("Save successful, reloading data...");
      toast.success("Record saved successfully!");
    } catch (e) {
      console.error("Save error:", e);
      const errorMessage =
        (e as any)?.response?.data?.message ||
        (e as any)?.response?.data?.error ||
        (e as any)?.message ||
        "Failed to save record";
      toast.error(`Error: ${errorMessage}`);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    // Basic validation
    for (const col of columns) {
      if (!col.optional && !editDataForm[col.key]) {
        toast.error(`${col.label} is required`);
        return;
      }
    }

    // Duplicate check (case-insensitive, excluding current item)
    const duplicate = data.find((item: any) => {
      const itemId = item._id || item.id;
      if (itemId === editingId) return false;

      const keysToCompare = ["name", "hsnCode", "code", "uomName"];
      return keysToCompare.some((key) => {
        if (editDataForm[key] && item[key]) {
          return (
            item[key].toString().toLowerCase() ===
            editDataForm[key].toString().toLowerCase()
          );
        }
        return false;
      });
    });

    if (duplicate) {
      toast.error("this name already exist");
      return;
    }

    const formattedData = { ...editDataForm };
    columns.forEach((col) => {
      if (col.type === "array" && typeof formattedData[col.key] === "string") {
        formattedData[col.key] = formattedData[col.key]
          .split(",")
          .map((s: string) => s.trim());
      }
    });

    try {
      if (type && !updateData && type) {
        await dispatch(
          updateMasterData({ id: editingId, payload: formattedData }),
        ).unwrap();
      } else if (updateData) {
        await updateData(editingId, formattedData);
        await loadData();
      }
      setEditingId(null);
      setEditDataForm({});
      toast.success("Record updated successfully!");
    } catch (e) {
      console.error("Update error:", e);
      toast.error(`Error: ${(e as any)?.message || "Failed to update record"}`);
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item._id || item.id);
    const initialForm = { ...item };
    // Convert arrays back to comma separated strings for editing
    columns.forEach((col) => {
      if (col.type === "array" && Array.isArray(initialForm[col.key])) {
        initialForm[col.key] = initialForm[col.key].join(", ");
      }
    });
    setEditDataForm(initialForm);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      if (type && !deleteData && type) {
        await dispatch(
          deleteMasterData({ id: deleteTargetId, organisationId: organisationId!, type }),
        ).unwrap();
      } else if (deleteData) {
        await deleteData(deleteTargetId);
        await loadData();
      }
      toast.success("Record deleted successfully!");
    } catch (e) {
      console.error("Delete error:", e);
      toast.error(`Error: ${(e as any)?.message || "Failed to delete record"}`);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
    }
  };

  const {
    filteredItems: filteredData,
    pagedItems,
    page,
    pageSize,
    totalItems,
    totalPages,
    setPage,
    setPageSize,
  } = useListControls({
    items: Array.isArray(data) ? data : [],
    searchTerm,
    initialPageSize: 10,
  });

  const activeFiltersCount = Object.keys(filters).filter(
    (key) =>
      filters[key] &&
      filters[key] !== "all" &&
      (Array.isArray(filters[key]) ? filters[key].length > 0 : true),
  ).length;

  const processedFilterFields = filterFields.map((field) => {
    if (
      (field.type === "tree-select" || field.type === "multi-select" || field.type === "select") &&
      (!field.options || field.options.length === 0)
    ) {
      if (field.type === "tree-select") {
        return {
          ...field,
          options: (data || []).map((item: any) => ({
            label: item.name || item.label || 'Unnamed',
            value: item._id || item.id,
            parentId: item.parentId,
          })),
        };
      } else {
        const uniqueValues = Array.from(
          new Set((data || []).map((item: any) => item[field.id]).filter(Boolean)),
        );
        return {
          ...field,
          options: uniqueValues.sort().map((v) => ({
            label: String(v),
            value: String(v),
          })),
        };
      }
    }
    return field;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
        >
          <Plus size={16} /> Add New
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className=" flex relative w-full max-w-sm">
            <Search
              className="absolute left-3 top-2.5 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:ring-1  focus:border-blue-500 outline-none"
            />
          </div>

          {filterFields.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 px-3 gap-2",
                    activeFiltersCount > 0
                      ? "bg-blue-50 text-blue-600 border-blue-200"
                      : "text-slate-600",
                  )}
                >
                  <Filter size={16} />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="bg-blue-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center ml-1">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-72 p-0 bg-transparent border-none shadow-none"
                align="end"
              >
                <FilterPanel
                  fields={processedFilterFields}
                  onFilterChange={setFilters}
                  onReset={() => setFilters({})}
                  className="border-none shadow-none"
                  showToggle={false}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="px-6 py-4 font-medium">
                    {col.label}
                  </th>
                ))}
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isAdding && (
                <tr className="bg-blue-50/50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4">
                      {col.type === "select" ? (
                        <select
                          autoFocus={col.key === columns[0].key}
                          className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={newData[col.key] || ""}
                          onChange={(e) =>
                            setNewData({
                              ...newData,
                              [col.key]: e.target.value,
                            })
                          }
                        >
                          <option value="">Select {col.label}</option>
                          {col.options
                            ? col.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))
                            : data.map((item: any) => (
                                <option
                                  key={item._id || item.id}
                                  value={item._id || item.id}
                                >
                                  {item.name}
                                </option>
                              ))}
                        </select>
                      ) : (
                        <input
                          autoFocus={col.key === columns[0].key}
                          type={col.type === "number" ? "number" : "text"}
                          placeholder={
                            col.type === "array" ? "Comma separated values" : ""
                          }
                          className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={newData[col.key] || ""}
                          onChange={(e) =>
                            setNewData({
                              ...newData,
                              [col.key]: e.target.value,
                            })
                          }
                        />
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleSave}
                        className="text-green-600 hover:bg-green-100 p-1 rounded"
                      >
                        <Save size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAdding(false)}
                        className="text-red-600 hover:bg-red-100 p-1 rounded"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="py-8 text-center text-slate-500"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin-slow" size={20} /> Loading
                      data...
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="py-8 text-center text-slate-500"
                  >
                    No records found.
                  </td>
                </tr>
              ) : (
                pagedItems.map((item) => {
                  const itemId = item._id || item.id;
                  const isEditing = editingId === itemId;

                  return (
                    <tr
                      key={itemId}
                      className={`hover:bg-slate-50 transition-colors ${isEditing ? "bg-blue-50/30" : ""}`}
                    >
                      {columns.map((col) => (
                        <td key={col.key} className="px-6 py-4 text-slate-700">
                          {isEditing ? (
                            col.type === "select" ? (
                              <select
                                className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={editDataForm[col.key] || ""}
                                onChange={(e) =>
                                  setEditDataForm({
                                    ...editDataForm,
                                    [col.key]: e.target.value,
                                  })
                                }
                              >
                                <option value="">Select {col.label}</option>
                                {col.options
                                  ? col.options.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))
                                  : data
                                      .filter(
                                        (i: any) =>
                                          (i._id || i.id) !== editingId,
                                      )
                                      .map((item: any) => (
                                        <option
                                          key={item._id || item.id}
                                          value={item._id || item.id}
                                        >
                                          {item.name}
                                        </option>
                                      ))}
                              </select>
                            ) : (
                              <input
                                type={col.type === "number" ? "number" : "text"}
                                className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                value={editDataForm[col.key] || ""}
                                onChange={(e) =>
                                  setEditDataForm({
                                    ...editDataForm,
                                    [col.key]: e.target.value,
                                  })
                                }
                              />
                            )
                          ) : Array.isArray(item[col.key]) ? (
                            item[col.key].join(", ")
                          ) : col.type === "select" && !col.options ? (
                            data.find(
                              (i: any) => (i._id || i.id) === item[col.key],
                            )?.name || item[col.key]
                          ) : (
                            item[col.key]
                          )}
                        </td>
                      ))}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={handleUpdate}
                                className="text-green-600 hover:bg-green-100 p-1.5 rounded transition-colors"
                              >
                                <Save size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="text-slate-500 hover:bg-slate-100 p-1.5 rounded transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEdit(item)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteClick(itemId)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 border-t border-slate-100">
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
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        itemName={(() => {
          const itemToDelete = data.find((i: any) => (i._id || i.id) === deleteTargetId);
          return itemToDelete?.name || itemToDelete?.code || itemToDelete?.uomName || undefined;
        })()}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};

export default MasterCrud;
