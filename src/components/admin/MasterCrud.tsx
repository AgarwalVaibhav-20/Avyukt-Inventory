import React, { useState, useEffect } from "react";
import { Plus, Trash2, Search, Save, X, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import Pagination from "@/components/common/Pagination";
import { useListControls } from "@/hooks/useListControls";
import {
  fetchMasterData,
  addMasterData,
  deleteMasterData,
} from "@/store/slices/masterSlice";

interface ColumnDef {
  key: string;
  label: string;
  type?: "text" | "number" | "array" | "select";
  options?: string[];
}

interface MasterCrudProps {
  title: string;
  description: string;
  columns: ColumnDef[];
  type: string; // e.g. 'category', 'uom', 'brand', 'hsn'
  fetchData?: (orgId?: string) => Promise<any[]>;
  addData?: (data: any) => Promise<any>;
  deleteData?: (id: string) => Promise<void>;
}

const MasterCrud: React.FC<MasterCrudProps> = ({
  title,
  description,
  columns,
  type,
  fetchData,
  addData,
  deleteData,
}) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { data: reduxData, loading: reduxLoading } = useAppSelector(
    (state) => state.master,
  );

  const [localData, setLocalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newData, setNewData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState("");

  const organisationId =
    user?.organisationId || localStorage.getItem("organisationId");

  const data = Array.isArray(reduxData[type]) ? reduxData[type] : (Array.isArray(localData) ? localData : []);
  const isLoading = loading || reduxLoading;

  const loadData = async () => {
    if (!organisationId) return;

    if (type && !fetchData) {
      dispatch(fetchMasterData({ type, organisationId }));
    } else if (fetchData) {
      setLoading(true);
      try {
        const result = await fetchData(organisationId);
        console.log("Loaded data:", result);
        setLocalData(result);
      } catch (error) {
        console.error("Failed to load data", error);
        alert(
          `Failed to load data: ${(error as any)?.message || "Unknown error"}`,
        );
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
    setIsAdding(false);
    setNewData({});
  }, [type, organisationId]);

  const handleSave = async () => {
    // Basic validation
    for (const col of columns) {
      if (!newData[col.key]) {
        alert(`${col.label} is required`);
        return;
      }
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
      if (type && !addData) {
        await dispatch(addMasterData({ ...formattedData, type })).unwrap();
      } else if (addData) {
        console.log("Saving data:", formattedData);
        await addData(formattedData);
        await loadData();
      }
      setIsAdding(false);
      setNewData({});
      console.log("Save successful, reloading data...");
      alert("Record saved successfully!");
    } catch (e) {
      console.error("Save error:", e);
      const errorMessage =
        (e as any)?.response?.data?.message ||
        (e as any)?.response?.data?.error ||
        (e as any)?.message ||
        "Failed to save record";
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this record?")) {
      if (type && !deleteData) {
        await dispatch(
          deleteMasterData({ id, organisationId: organisationId!, type }),
        ).unwrap();
      } else if (deleteData) {
        await deleteData(id);
        await loadData();
      }
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
          <div className="relative w-full max-w-sm">
            <Search
              className="absolute left-3 top-2.5 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
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
                      {col.type === "select" && col.options ? (
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
                          {col.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
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
                      <Loader2 className="animate-spin" size={20} /> Loading
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
                pagedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-6 py-4 text-slate-700">
                        {Array.isArray(item[col.key])
                          ? item[col.key].join(", ")
                          : item[col.key]}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
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
    </div>
  );
};

export default MasterCrud;
