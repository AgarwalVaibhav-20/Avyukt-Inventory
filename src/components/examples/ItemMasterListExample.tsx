import React, { useState, useEffect } from "react";
import { Loader, AlertCircle } from "lucide-react";
import Pagination from "@/components/common/Pagination";
import FilterPanel, { FilterField } from "@/components/common/FilterPanel";
import api from "@/services/api";

interface Item {
  _id: string;
  itemCode: string;
  itemName: string;
  category: string;
  unit: string;
  status: string;
  hsn: string;
}

interface ListResponse {
  items: Item[];
  total: number;
  page: number;
  limit: number;
}

/**
 * EXAMPLE: ItemMasterList with Pagination and Filtering
 * 
 * This example shows how to implement pagination and filtering
 * on a list view. Copy this pattern to any other list component.
 */
const ItemMasterListExample: React.FC = () => {
  // State Management
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch items on page/limit/filter change
  useEffect(() => {
    fetchItems();
  }, [page, limit, filters]);

  // Fetch categories for filter options
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Add filters to query
      if (filters.itemCode) {
        params.append("search", filters.itemCode);
      }
      if (filters.category) {
        params.append("category", filters.category);
      }
      if (filters.status) {
        params.append("status", filters.status);
      }

      const response = await api.get<ListResponse>(`/itemmaster?${params.toString()}`);

      if (response.data) {
        setItems(response.data.items);
        setTotal(response.data.total);
      }
    } catch (err) {
      console.error("Error fetching items:", err);
      setError("Failed to load items. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories");
      if (response.data?.categories) {
        setCategories(response.data.categories);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  // Define filter fields
  const filterFields: FilterField[] = [
    {
      id: "itemCode",
      label: "Item Code",
      type: "text",
      placeholder: "Search by code...",
    },
    {
      id: "category",
      label: "Category",
      type: "select",
      options: categories.map((cat) => ({ label: cat, value: cat })),
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
  ];

  // Handle filter changes
  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setFilters({});
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Item Master</h1>
        <p className="text-gray-600">Manage and view all items</p>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        fields={filterFields}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        title="Filters"
      />

      {/* Error Message */}
      {error && (
        <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle className="h-5 w-5 mr-3" />
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Items Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No items found
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {item.itemCode}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {item.itemName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {item.unit}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {items.length > 0 && (
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(total / limit)}
              pageSize={limit}
              totalItems={total}
              onPageChange={setPage}
              onPageSizeChange={setLimit}
              pageSizeOptions={[10, 20, 50, 100]}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ItemMasterListExample;

/**
 * KEY IMPLEMENTATION POINTS:
 * 
 * 1. STATE MANAGEMENT
 *    - items: Current page items
 *    - page, limit: Pagination state
 *    - filters: Active filters
 *    - total: Total item count
 * 
 * 2. FETCH FUNCTION
 *    - Always reset to page 1 on filter change
 *    - Build query parameters from state
 *    - Handle loading and error states
 * 
 * 3. FILTER PANEL
 *    - Define filter fields with types
 *    - Handle filter changes by calling API
 *    - Provide reset functionality
 * 
 * 4. PAGINATION
 *    - Pass current state to component
 *    - Update page/limit on change
 *    - Calculate totalPages from API response
 * 
 * 5. USER FEEDBACK
 *    - Show loading spinner during fetch
 *    - Display error messages
 *    - Show "No items found" state
 * 
 * REUSE THIS PATTERN FOR ANY LIST VIEW!
 */
