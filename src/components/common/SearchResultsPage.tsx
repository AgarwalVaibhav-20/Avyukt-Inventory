import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchAPI } from "@/services/searchService";
import { MENU_ITEMS } from "@/constants";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader,
  AlertCircle,
  Box,
  Package,
  Layers,
  ShoppingCart,
  TrendingUp,
  Home,
  Building,
  Grid,
  CheckSquare,
  Shield,
  FileText,
  AlertCircleIcon,
  Wrench,
  Settings,
  Briefcase,
  ArrowRight,
} from "lucide-react";

interface SearchResult {
  _id: string;
  _entityType: string;
  _modelKey: string;
  _icon: string;
  _route?: string;
  [key: string]: any;
}

interface SearchResults {
  items: SearchResult[];
  totalCount: number;
  filteredCount: number;
  page: number;
  limit: number;
  totalPages: number;
  entityCounts: Record<string, number>;
}

interface EntityType {
  key: string;
  label: string;
  icon: string;
}

const iconMap: Record<string, React.ReactNode> = {
  box: <Box className="h-5 w-5" />,
  package: <Package className="h-5 w-5" />,
  layers: <Layers className="h-5 w-5" />,
  "shopping-cart": <ShoppingCart className="h-5 w-5" />,
  "trending-up": <TrendingUp className="h-5 w-5" />,
  home: <Home className="h-5 w-5" />,
  building: <Building className="h-5 w-5" />,
  grid: <Grid className="h-5 w-5" />,
  "check-square": <CheckSquare className="h-5 w-5" />,
  shield: <Shield className="h-5 w-5" />,
  "file-text": <FileText className="h-5 w-5" />,
  "alert-circle": <AlertCircleIcon className="h-5 w-5" />,
  tool: <Wrench className="h-5 w-5" />,
  settings: <Settings className="h-5 w-5" />,
  briefcase: <Briefcase className="h-5 w-5" />,
};

const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const query = searchParams.get("q") || "";
  const typeFilter = searchParams.get("type") || "";
  const currentPage = parseInt(searchParams.get("page") || "1");

  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    typeFilter ? typeFilter.split(",").filter(Boolean) : []
  );
  const [showFilters, setShowFilters] = useState(false);
  const pageMatches = MENU_ITEMS.flatMap((item) =>
    (item.subMenus || []).map((sub) => ({
      id: `${item.id}-${sub.id}`,
      label: sub.label,
      section: item.label,
      route: `/${item.id}/${sub.id}`,
    }))
  ).filter((page) => {
    const normalizedQuery = query.trim().toLowerCase();
    return (
      normalizedQuery &&
      (page.label.toLowerCase().includes(normalizedQuery) ||
        page.section.toLowerCase().includes(normalizedQuery))
    );
  }).slice(0, 8);

  // Fetch entity types on mount
  useEffect(() => {
    const fetchEntityTypes = async () => {
      try {
        const response = await searchAPI.getEntityTypes();
        if (response.success) {
          setEntityTypes(response.data);
        }
      } catch (err) {
        console.error("Error fetching entity types:", err);
      }
    };

    fetchEntityTypes();
  }, []);

  // Perform search
  useEffect(() => {
    if (!query) return;

    const performSearch = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await searchAPI.search(
          query,
          selectedTypes.length > 0 ? selectedTypes : undefined,
          currentPage,
          10
        );

        if (response.success) {
          setResults(response.data);
        } else {
          setError(response.message || "Search failed");
        }
      } catch (err) {
        console.error("Error performing search:", err);
        setError("Failed to perform search. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query, selectedTypes, currentPage]);

  const handleTypeFilter = (typeKey: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeKey)
        ? prev.filter((t) => t !== typeKey)
        : [...prev, typeKey]
    );
    // Reset to first page
    setSearchParams({
      q: query,
      ...(selectedTypes.length > 0 && {
        type: selectedTypes.includes(typeKey)
          ? selectedTypes.filter((t) => t !== typeKey).join(",")
          : [...selectedTypes, typeKey].join(","),
      }),
    });
  };

  const handleClearFilters = () => {
    setSelectedTypes([]);
    setSearchParams({ q: query });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({
      q: query,
      page: newPage.toString(),
      ...(selectedTypes.length > 0 && { type: selectedTypes.join(",") }),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResultClick = (result: SearchResult) => {
    if (result._route) {
      navigate(result._route);
      return;
    }

    // Navigate to entity detail page based on model key
    const detailPages: Record<string, (id: string) => string> = {
      itemMaster: (id) => `/product-master/item-master/${id}`,
      product: (id) => `/product-master/product/${id}`,
      rawMaterial: (id) => `/product-master/raw-material/${id}`,
      purchaseOrder: (id) => `/purchase/po/${id}`,
      salesOrder: (id) => `/outward/so/${id}`,
      warehouse: (id) => `/warehouse/detail/${id}`,
      vendor: (id) => `/purchase/vendor/${id}`,
      bin: (id) => `/warehouse/bin/${id}`,
      grn: (id) => `/inward/grn/${id}`,
      qualityCheck: (id) => `/quality/qc/${id}`,
      invoice: (id) => `/documents/invoice/${id}`,
      equipment: (id) => `/plant-machinery/equipment/${id}`,
      machinery: (id) => `/plant-machinery/machinery/${id}`,
      project: (id) => `/projects/detail/${id}`,
    };

    const getPageUrl = detailPages[result._modelKey];
    if (getPageUrl) {
      navigate(getPageUrl(result._id));
    } else {
      // Fallback: show result details in a modal or alert
      console.log("No detail page configured for:", result._modelKey);
    }
  };

  const formatResultDisplay = (result: SearchResult) => {
    // Extract key fields based on entity type
    const displayFields: Record<string, string[]> = {
      itemMaster: ["itemCode", "itemName", "category"],
      product: ["sku", "name", "category"],
      rawMaterial: ["itemCode", "name", "category"],
      purchaseOrder: ["poNumber", "status", "totalEstimatedAmount"],
      salesOrder: ["soNumber", "customer", "status"],
      warehouse: ["name", "location", "type"],
      vendor: ["vendorName", "contactPerson", "email"],
    };

    const fields = displayFields[result._modelKey] || ["name", "code"];
    return fields
      .map((f) => result[f])
      .filter(Boolean)
      .join(" / ");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Search Results</h1>
              <p className="text-gray-600 mt-2">
                {query && (
                  <>
                    Searching for: <span className="font-semibold">"{query}"</span>
                  </>
                )}
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="h-5 w-5" />
              Filters
            </button>
          </div>

          {/* Filters Bar */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">
                  Filter by Type
                </h2>
                {selectedTypes.length > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {entityTypes.map((type) => (
                  <button
                    key={type.key}
                    onClick={() => handleTypeFilter(type.key)}
                    className={`px-3 py-1 text-sm rounded-full font-medium transition-colors ${
                      selectedTypes.includes(type.key)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {type.label}
                    {results?.entityCounts[type.key] && (
                      <span className="ml-1">
                        ({results.entityCounts[type.key]})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {pageMatches.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Matching pages
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {pageMatches.map((page) => (
                <button
                  key={page.id}
                  onClick={() => navigate(page.route)}
                  className="flex items-center justify-between gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-sm text-left transition-all"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {page.label}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {page.section}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
            <span className="text-red-800">{error}</span>
          </div>
        ) : !results || results.items.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No results found
            </h2>
            <p className="text-gray-600">
              Try adjusting your search query or filters
            </p>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Found <span className="font-semibold">{results.totalCount}</span>{" "}
                results
                {selectedTypes.length > 0 && (
                  <span>
                    {" "}
                    in{" "}
                    <span className="font-semibold">
                      {selectedTypes
                        .map(
                          (t) =>
                            entityTypes.find((et) => et.key === t)?.label || t
                        )
                        .join(", ")}
                    </span>
                  </span>
                )}
              </p>
            </div>

            {/* Results Grid */}
            <div className="space-y-4">
              {results.items.map((result) => (
                <button
                  key={result._id}
                  onClick={() => handleResultClick(result)}
                  className="w-full p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-400 transition-all text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 text-blue-600 mt-1">
                      {iconMap[result._icon] || <Box className="h-5 w-5" />}
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {result.itemName ||
                          result.productName ||
                          result.name ||
                          result.vendorName ||
                          result.poNumber ||
                          result.soNumber ||
                          result.invoiceNumber ||
                          result.grnNumber ||
                          result.code ||
                          "Unnamed"}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {formatResultDisplay(result)}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="inline-block px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                        {result._entityType}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {results.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(results.page - 1)}
                  disabled={results.page <= 1}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: results.totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          page === results.page
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={() => handlePageChange(results.page + 1)}
                  disabled={results.page >= results.totalPages}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;
