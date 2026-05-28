import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  AlertTriangle,
  Package,
  RefreshCcw,
  Activity,
  Sparkles,
  IndianRupee,
  Loader2,
  Building2,
  Tag,
  ChevronRight,
  FilterX,
  Search,
  CheckCircle,
  X,
} from "lucide-react";
import { dashboardService } from "@/services/dashboardService";
import { getInventoryInsights } from "@/services/geminiService";
import { productService } from "@/services/productService";
import { useAppSelector } from "@/store/hooks";
import { InventoryItem, WarehouseStockReport } from "@/types";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const EMPTY_STOCK_DATA = [{ name: "No Data", stock: 0 }];
const EMPTY_CATEGORY_DATA = [{ name: "No Data", value: 100 }];

interface StatCard {
  label: string;
  value: string | number;
  sub: string;
  subColor: string;
  icon: any;
  iconBg: string;
  iconColor: string;
}

const Dashboard: React.FC = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  
  // Master states loaded from API
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [warehouse, setWarehouse] = useState<WarehouseStockReport[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<any[]>([]);
  const [stockData, setStockData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  
  // Interactive Filter States
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    loadDashboardData();
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log("📊 Loading dashboard data from backend...");

      // Fetch all dashboard data and the full item inventory database in parallel
      const [approvalsData, expiryAlertsData, movementsData, warehouseData, inOutData, allItems] = await Promise.all([
        dashboardService.getPendingApprovals(),
        dashboardService.getExpiryAlerts(),
        dashboardService.getMovementAnalysis(),
        dashboardService.getWarehouseStockReport(),
        dashboardService.getInOutSummary(),
        productService.getAllItems().catch((err) => {
          console.error("Failed to load products for interconnection:", err);
          return [] as InventoryItem[];
        }),
      ]);

      setApprovals(approvalsData);
      setExpiryAlerts(expiryAlertsData);
      setMovements(movementsData);
      setWarehouse(warehouseData);
      setItems(allItems);

      setStockData(inOutData.map((item: any) => ({
        name: item.period?.split(" ")[0] || item.period || "N/A",
        stock: Math.round(Number(item.inwardValue || 0) + Number(item.outwardValue || 0))
      })));

      // Calculate initial static category distribution from movements
      const categoryMap: Record<string, number> = {};
      movementsData.forEach((item: any) => {
        const cat = item.category || "Other";
        categoryMap[cat] = (categoryMap[cat] || 0) + (item.turnoverRate || 0);
      });
      
      const categoryDistribution = Object.entries(categoryMap).map(([name, value]) => ({
        name,
        value: Math.round(Number(value))
      }));
      setCategoryData(categoryDistribution.slice(0, 4));

      console.log("📊 Dashboard data loaded successfully");
      
      // Load AI insights in the background
      void handleGenerateInsight(movementsData, allItems);
    } catch (error) {
      console.error("❌ Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsight = async (inventoryData: any = [], allItemsList: InventoryItem[] = []) => {
    setLoadingAi(true);
    try {
      let targetData = inventoryData;

      // If filters are active, generate insights specific to the filtered item set
      if (selectedWarehouseId || selectedCategory) {
        const filtered = allItemsList.filter(item => {
          if (selectedWarehouseId && !(item.stocks || []).some(s => s.warehouseId === selectedWarehouseId && s.quantity > 0)) return false;
          if (selectedCategory && item.category?.toLowerCase() !== selectedCategory.toLowerCase()) return false;
          return true;
        });

        targetData = filtered.map(item => ({
          itemName: item.name,
          sku: item.sku,
          category: item.category,
          stock: selectedWarehouseId 
            ? (item.stocks || []).reduce((sum, s) => s.warehouseId === selectedWarehouseId ? sum + s.quantity : sum, 0)
            : item.stock,
          reorderLevel: item.reorderLevel,
          value: selectedWarehouseId
            ? (item.stocks || []).reduce((sum, s) => s.warehouseId === selectedWarehouseId ? sum + (s.quantity * (s.unitCost || item.unitPrice || 0)) : sum, 0)
            : item.stock * (item.unitPrice || 0),
        }));
      }

      const result = await getInventoryInsights(targetData);
      setAiInsight(result);
    } catch (error) {
      console.error("Error generating AI insight:", error);
      setAiInsight("Unable to generate insights at this moment.");
    } finally {
      setLoadingAi(false);
    }
  };

  // Re-run AI insights in background when filter states change
  useEffect(() => {
    if (!loading && items.length > 0) {
      handleGenerateInsight(movements, items);
    }
  }, [selectedWarehouseId, selectedCategory]);

  // Dynamic Statistics Calculations based on active filters
  const dynamicStats = useMemo(() => {
    const approvalCount = approvals.length;
    const expiryCount = expiryAlerts.length;

    let totalValue = 0;
    let lowStockCount = 0;

    // Filter movements by category/warehouse
    const activeMovements = movements.filter((m) => {
      if (selectedCategory && m.category?.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      if (selectedWarehouseId) {
        const item = items.find((i) => i.id === m.itemId || i.sku === m.sku);
        return item?.stocks?.some((s) => s.warehouseId === selectedWarehouseId) ?? false;
      }
      return true;
    });
    
    const fastMovingCount = activeMovements.filter((m) => m.classification === "Fast Moving").length;

    if (selectedWarehouseId || selectedCategory) {
      items.forEach((item) => {
        if (selectedCategory && item.category?.toLowerCase() !== selectedCategory.toLowerCase()) return;
        
        let qty = 0;
        let value = 0;
        if (selectedWarehouseId) {
          const whStock = (item.stocks || []).find((s) => s.warehouseId === selectedWarehouseId);
          qty = whStock ? whStock.quantity : 0;
          value = qty * (whStock?.unitCost || item.unitPrice || 0);
        } else {
          qty = item.stock || 0;
          value = qty * (item.unitPrice || 0);
        }

        totalValue += value;

        const limit = item.reorderLevel || 0;
        if (limit > 0 && qty <= limit) {
          lowStockCount += 1;
        }
      });
    } else {
      totalValue = warehouse.reduce((sum: number, w: any) => sum + (Number(w.totalValue) || 0), 0);
      lowStockCount = expiryCount;
    }

    return {
      totalValue,
      lowStockCount,
      approvalCount,
      fastMovingCount,
    };
  }, [approvals, expiryAlerts, movements, warehouse, items, selectedWarehouseId, selectedCategory]);

  // Dynamic Stat Cards mapping
  const dynamicStatCardsList = useMemo<StatCard[]>(() => {
    return [
      {
        label: selectedWarehouseId ? "Warehouse Inventory Value" : "Total Inventory Value",
        value: `₹${(dynamicStats.totalValue / 1000000).toFixed(2)}M`,
        sub: selectedWarehouseId 
          ? `In ${warehouse.find((w) => w.warehouseId === selectedWarehouseId)?.warehouseName}`
          : `${warehouse.length} warehouses`,
        subColor: "text-slate-500",
        icon: IndianRupee,
        iconBg: "bg-blue-50",
        iconColor: "text-blue-500",
      },
      {
        label: "Low Stock Items",
        value: dynamicStats.lowStockCount,
        sub: selectedWarehouseId ? "Warehouse Specific" : "Requires Attention",
        subColor: "text-red-500",
        icon: AlertTriangle,
        iconBg: "bg-red-50",
        iconColor: "text-red-500",
      },
      {
        label: "Pending Approvals",
        value: dynamicStats.approvalCount,
        sub: dynamicStats.approvalCount > 0 ? "Action Required" : "All Clear",
        subColor: dynamicStats.approvalCount > 0 ? "text-orange-500" : "text-emerald-500",
        icon: Package,
        iconBg: "bg-orange-50",
        iconColor: "text-orange-500",
      },
      {
        label: "Fast Moving Items",
        value: dynamicStats.fastMovingCount,
        sub: "Healthy Turnover",
        subColor: "text-emerald-500",
        icon: RefreshCcw,
        iconBg: "bg-purple-50",
        iconColor: "text-purple-500",
      },
    ];
  }, [dynamicStats, warehouse, selectedWarehouseId]);

  // Dynamic Category Distribution mapping
  const dynamicCategoryDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    
    items.forEach((item) => {
      let qty = 0;
      if (selectedWarehouseId) {
        qty = (item.stocks || []).reduce((sum, s) => s.warehouseId === selectedWarehouseId ? sum + s.quantity : sum, 0);
      } else {
        qty = item.stock || 0;
      }
      
      if (qty <= 0) return;
      const cat = item.category || "Other";
      const val = qty * (item.unitPrice || item.salePrice || 0);
      map[cat] = (map[cat] || 0) + val;
    });

    const entries = Object.entries(map).map(([name, value]) => ({
      name,
      value: Math.round(value)
    }));

    if (entries.length === 0) {
      return categoryData;
    }

    return entries.sort((a, b) => b.value - a.value).slice(0, 5);
  }, [items, selectedWarehouseId, categoryData]);

  // Dynamic Warehouse Utilization mapping
  const dynamicWarehouseDistribution = useMemo(() => {
    if (!selectedCategory) return warehouse;

    return warehouse.map((wh) => {
      let totalValue = 0;
      let totalItems = 0;
      let totalQuantity = 0;

      items.forEach((item) => {
        if (item.category?.toLowerCase() !== selectedCategory.toLowerCase()) return;

        const whStock = (item.stocks || []).find((s) => s.warehouseId === wh.warehouseId);
        if (whStock && whStock.quantity > 0) {
          totalItems += 1;
          totalQuantity += whStock.quantity;
          totalValue += whStock.quantity * (whStock.unitCost || item.unitPrice || 0);
        }
      });

      return {
        ...wh,
        totalItems,
        totalQuantity,
        totalValue,
        utilization: wh.capacity > 0 ? Math.min(100, Math.round((totalQuantity / wh.capacity) * 100)) : 0,
      };
    });
  }, [warehouse, items, selectedCategory]);

  // Dynamic stock items list filtered by category and warehouse selection
  const dynamicStockItemsList = useMemo(() => {
    return items.filter((item) => {
      if (selectedWarehouseId) {
        const hasStock = (item.stocks || []).some((s) => s.warehouseId === selectedWarehouseId && s.quantity > 0);
        if (!hasStock) return false;
      }
      if (selectedCategory) {
        if (item.category?.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return item.name?.toLowerCase().includes(query) || item.sku?.toLowerCase().includes(query);
      }
      return true;
    }).map((item) => {
      let stockQty = item.stock;
      let stockValue = item.stock * (item.unitPrice || 0);
      
      if (selectedWarehouseId) {
        const whStock = (item.stocks || []).find((s) => s.warehouseId === selectedWarehouseId);
        stockQty = whStock ? whStock.quantity : 0;
        stockValue = stockQty * (whStock?.unitCost || item.unitPrice || 0);
      }

      return {
        ...item,
        stockQty,
        stockValue,
      };
    }).sort((a, b) => b.stockValue - a.stockValue);
  }, [items, selectedWarehouseId, selectedCategory, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 p-1">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-5 p-1">
      {/* Active Filter Indicators */}
      {(selectedWarehouseId || selectedCategory) && (
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-3 px-4 animate-in fade-in duration-200">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            Active Dashboard Filters:
          </span>
          {selectedWarehouseId && (
            <span className="flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-600 px-3 py-1 rounded-xl border border-blue-100">
              Warehouse: {warehouse.find((w) => w.warehouseId === selectedWarehouseId)?.warehouseName || "Selected"}
              <button 
                onClick={() => setSelectedWarehouseId(null)}
                className="hover:bg-blue-100 p-0.5 rounded text-blue-500 hover:text-blue-700 transition-colors"
                title="Remove warehouse filter"
              >
                <X size={11} />
              </button>
            </span>
          )}
          {selectedCategory && (
            <span className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-xl border border-indigo-100">
              Category: {selectedCategory}
              <button 
                onClick={() => setSelectedCategory(null)}
                className="hover:bg-indigo-100 p-0.5 rounded text-indigo-500 hover:text-indigo-700 transition-colors"
                title="Remove category filter"
              >
                <X size={11} />
              </button>
            </span>
          )}
          <button
            onClick={() => {
              setSelectedWarehouseId(null);
              setSelectedCategory(null);
            }}
            className="ml-auto flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors"
          >
            <FilterX size={13} />
            Reset All
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {dynamicStatCardsList.map(
          ({ label, value, sub, subColor, icon: Icon, iconBg, iconColor }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow transition-shadow"
            >
              <div className={`${iconBg} ${iconColor} p-3 rounded-xl shrink-0`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 font-medium truncate">
                  {label}
                </p>
                <p className="text-xl font-bold text-slate-800 leading-tight">
                  {value}
                </p>
                <p className={`text-xs font-medium mt-0.5 ${subColor}`}>
                  {sub}
                </p>
              </div>
            </div>
          ),
        )}
      </div>

      {/* Interactive Warehouse Card Grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-50 text-blue-500 p-2 rounded-xl">
              <Building2 size={16} />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-700 block">
                Warehouse Allocation
              </span>
              <span className="text-[11px] text-slate-400">
                Select a warehouse to filter stock trend, categories, items, and AI insights
              </span>
            </div>
          </div>
          {selectedWarehouseId && (
            <button
              onClick={() => setSelectedWarehouseId(null)}
              className="text-xs text-blue-500 hover:text-blue-700 font-semibold"
            >
              Show All Warehouses
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dynamicWarehouseDistribution.map((wh) => {
            const isSelected = selectedWarehouseId === wh.warehouseId;
            const isHigh = wh.utilization > 80;
            return (
              <div
                key={wh.warehouseId}
                onClick={() => setSelectedWarehouseId(isSelected ? null : wh.warehouseId)}
                className={`cursor-pointer border rounded-2xl p-4 transition-all duration-200 hover:shadow-md hover:scale-[1.01] ${
                  isSelected 
                    ? "border-blue-500 bg-blue-50/30 ring-2 ring-blue-500/20" 
                    : "border-slate-100 hover:border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? "bg-blue-500 text-white" : "bg-slate-50 text-slate-400"}`}>
                      <Building2 size={13} />
                    </div>
                    <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                      {wh.warehouseName}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-lg">
                      Active
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>SKUs</span>
                    <span className="font-semibold text-slate-700">{wh.totalItems}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Stock Value</span>
                    <span className="font-bold text-slate-800">₹{wh.totalValue.toLocaleString()}</span>
                  </div>
                </div>

                {/* Utilization bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[9px] mb-1">
                    <span className="text-slate-400 uppercase tracking-wide">Capacity Used</span>
                    <span className={`font-bold ${isHigh ? "text-red-500" : "text-emerald-500"}`}>
                      {wh.utilization}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                    <div
                      className={`h-1 rounded-full transition-all ${isHigh ? "bg-red-400" : "bg-emerald-400"}`}
                      style={{ width: `${wh.utilization}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Insight */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-50 text-indigo-500 p-2 rounded-xl">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-700 block">
                AI Inventory Analyst
              </span>
              <span className="text-[11px] text-slate-400">
                {selectedWarehouseId || selectedCategory 
                  ? "Adaptive analysis matching your active filters" 
                  : "Overall organization inventory analysis"}
              </span>
            </div>
          </div>
          <button
            onClick={() => handleGenerateInsight(movements, items)}
            disabled={loadingAi}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
          >
            <RefreshCcw size={12} className={loadingAi ? "animate-spin" : ""} />
            {loadingAi ? "Analyzing..." : "Refresh Analysis"}
          </button>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 min-h-[80px] text-sm text-slate-600">
          {aiInsight ? (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: aiInsight }}
            />
          ) : (
            <span className="text-slate-400 italic">
              Initializing AI model to analyze stock levels...
            </span>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Line Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-blue-500" />
            <div>
              <span className="text-sm font-semibold text-slate-700 block">
                Stock Value Trend
              </span>
              <span className="text-[10px] text-slate-400">
                Organization-wide history (Last 6 months)
              </span>
            </div>
          </div>
          <div className="h-52 min-h-[208px] min-w-0 w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={240}
              minHeight={208}
            >
              <LineChart data={stockData.length > 0 ? stockData : EMPTY_STOCK_DATA}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="stock"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: "#3b82f6", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <Package size={16} className="text-emerald-500" />
            <div>
              <span className="text-sm font-semibold text-slate-700 block">
                Stock by Category
              </span>
              <span className="text-[10px] text-slate-400">
                Click a category in the legend or slice to filter inventory
              </span>
            </div>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="ml-auto text-[11px] text-indigo-500 hover:text-indigo-700 font-semibold"
              >
                Reset Category
              </button>
            )}
          </div>
          <div className="flex items-center gap-6 min-w-0">
            <div className="h-52 min-h-[208px] flex-1 min-w-0 w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={240}
                minHeight={208}
              >
                <PieChart>
                  <Pie
                    data={dynamicCategoryDistribution.length > 0 ? dynamicCategoryDistribution : EMPTY_CATEGORY_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    onClick={(data, index) => {
                      const catName = dynamicCategoryDistribution[index]?.name;
                      if (catName) {
                        setSelectedCategory(selectedCategory === catName ? null : catName);
                      }
                    }}
                  >
                    {(dynamicCategoryDistribution.length > 0 ? dynamicCategoryDistribution : EMPTY_CATEGORY_DATA).map((_, i) => (
                      <Cell 
                        key={i} 
                        fill={COLORS[i % COLORS.length]} 
                        className="cursor-pointer hover:opacity-85 transition-opacity"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      fontSize: 12,
                    }}
                    formatter={(val: number) => [`₹${val.toLocaleString()}`, "Stock Value"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 shrink-0 max-w-[150px]">
              {(dynamicCategoryDistribution.length > 0 ? dynamicCategoryDistribution : EMPTY_CATEGORY_DATA).map((entry, i) => {
                const isSelected = selectedCategory === entry.name;
                return (
                  <div
                    key={i}
                    onClick={() => {
                      if (entry.name !== "No Data") {
                        setSelectedCategory(isSelected ? null : entry.name);
                      }
                    }}
                    className={`flex items-center gap-2 text-xs cursor-pointer p-1.5 rounded-xl transition-colors hover:bg-slate-50 ${
                      isSelected ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-100/50" : "text-slate-600 font-medium"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="truncate max-w-[100px]" title={entry.name}>{entry.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stock Items Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-50 text-emerald-500 p-2 rounded-xl">
              <Package size={16} />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-700 block">
                Stock Inventory List
              </span>
              <span className="text-[11px] text-slate-400">
                Detailed view of items based on active filters
              </span>
            </div>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 font-semibold border-b border-slate-100">
                <th className="p-3">Product / SKU</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">
                  {selectedWarehouseId ? "Stock in Warehouse" : "Total Stock"}
                </th>
                <th className="p-3 text-right">Value</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium">
              {dynamicStockItemsList.length > 0 ? (
                dynamicStockItemsList.slice(0, 15).map((item) => {
                  const statusColors: Record<string, string> = {
                    "In Stock": "bg-emerald-50 text-emerald-600 border-emerald-100",
                    "in-stock": "bg-emerald-50 text-emerald-600 border-emerald-100",
                    "Low Stock": "bg-orange-50 text-orange-600 border-orange-100",
                    "low-stock": "bg-orange-50 text-orange-600 border-orange-100",
                    "Out of Stock": "bg-rose-50 text-rose-600 border-rose-100",
                    "out-of-stock": "bg-rose-50 text-rose-600 border-rose-100",
                  };
                  const statusLabel = item.stockQty === 0 
                    ? "Out of Stock" 
                    : (item.reorderLevel && item.stockQty <= item.reorderLevel) 
                      ? "Low Stock" 
                      : "In Stock";
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{item.name}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">{item.sku}</div>
                      </td>
                      <td className="p-3 text-slate-500">{item.category}</td>
                      <td className="p-3 text-right font-semibold text-slate-800">
                        {item.stockQty.toLocaleString()} {item.uom || "units"}
                      </td>
                      <td className="p-3 text-right font-semibold text-slate-800">
                        ₹{item.stockValue.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[statusLabel] || "bg-slate-100 text-slate-600"}`}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                    No items found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {dynamicStockItemsList.length > 15 && (
          <div className="text-[11px] text-slate-400 text-center font-medium">
            Showing top 15 of {dynamicStockItemsList.length} items. Use search to filter more items.
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;