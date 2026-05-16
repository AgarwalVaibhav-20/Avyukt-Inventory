import React, { useEffect, useState } from "react";
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
  TrendingUp,
  Package,
  RefreshCcw,
  Activity,
  Sparkles,
  IndianRupee,
  Loader2,
} from "lucide-react";
import { dashboardService } from "@/services/dashboardService";
import { getInventoryInsights } from "@/services/geminiService";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

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
  const [statCards, setStatCards] = useState<StatCard[]>([]);
  const [stockData, setStockData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading dashboard data from backend...');

      // Fetch all dashboard data in parallel
      const [approvals, expiryAlerts, movements, warehouse, inOut] = await Promise.all([
        dashboardService.getPendingApprovals(),
        dashboardService.getExpiryAlerts(),
        dashboardService.getMovementAnalysis(),
        dashboardService.getWarehouseStockReport(),
        dashboardService.getInOutSummary(),
      ]);

      // Calculate stats from backend data
      const approvalCount = approvals.length;
      const expiryCount = expiryAlerts.length;
      const lowStockCount = expiryCount; // Items with low stock/expiry issues
      const totalValue = warehouse.reduce((sum: number, w: any) => sum + (Number(w.totalValue) || 0), 0);
      
      // Calculate category distribution
      const categoryMap: Record<string, number> = {};
      movements.forEach((item: any) => {
        const cat = item.category || 'Other';
        categoryMap[cat] = (categoryMap[cat] || 0) + (item.turnoverRate || 0);
      });
      
      const categoryDistribution = Object.entries(categoryMap).map(([name, value]) => ({
        name,
        value: Math.round(Number(value))
      }));

      // Update stat cards with real data
      const newStatCards: StatCard[] = [
        {
          label: "Total Inventory Value",
          value: `₹${(totalValue / 1000000).toFixed(2)}M`,
          sub: `${warehouse.length} warehouses`,
          subColor: "text-slate-500",
          icon: IndianRupee,
          iconBg: "bg-blue-50",
          iconColor: "text-blue-500",
        },
        {
          label: "Low Stock Items",
          value: lowStockCount,
          sub: "Requires Attention",
          subColor: "text-red-500",
          icon: AlertTriangle,
          iconBg: "bg-red-50",
          iconColor: "text-red-500",
        },
        {
          label: "Pending Approvals",
          value: approvalCount,
          sub: approvalCount > 0 ? "Action Required" : "All Clear",
          subColor: approvalCount > 0 ? "text-orange-500" : "text-emerald-500",
          icon: Package,
          iconBg: "bg-orange-50",
          iconColor: "text-orange-500",
        },
        {
          label: "Fast Moving Items",
          value: movements.filter((m: any) => m.classification === 'Fast Moving').length,
          sub: "Healthy Turnover",
          subColor: "text-emerald-500",
          icon: RefreshCcw,
          iconBg: "bg-purple-50",
          iconColor: "text-purple-500",
        },
      ];

      setStatCards(newStatCards);
      setStockData(inOut.map((item: any) => ({
        name: item.period?.split(' ')[0] || item.period || 'N/A',
        stock: Math.round(Number(item.inwardValue || 0) + Number(item.outwardValue || 0))
      })));
      setCategoryData(categoryDistribution.slice(0, 4));

      console.log('�... Dashboard data loaded successfully');
      
      // Load AI insights with real inventory data
      await handleGenerateInsight(movements);
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsight = async (inventoryData: any = []) => {
    setLoadingAi(true);
    try {
      const result = await getInventoryInsights(inventoryData);
      setAiInsight(result);
    } catch (error) {
      console.error('Error generating AI insight:', error);
      setAiInsight('Unable to generate insights at this moment.');
    } finally {
      setLoadingAi(false);
    }
  };

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

  return (
    <div className="space-y-5 p-1">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(
          ({ label, value, sub, subColor, icon: Icon, iconBg, iconColor }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4"
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

      {/* AI Insight */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-50 text-indigo-500 p-2 rounded-xl">
              <Sparkles size={16} />
            </div>
            <span className="text-sm font-semibold text-slate-700">
              AI Inventory Analyst
            </span>
          </div>
          <button
            onClick={() => loadDashboardData()}
            disabled={loadingAi}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
          >
            <RefreshCcw size={12} className={loadingAi ? "animate-spin" : ""} />
            {loadingAi ? "Analyzing..." : "Refresh"}
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-blue-500" />
            <span className="text-sm font-semibold text-slate-700">
              Stock Value Trend
            </span>
            <span className="ml-auto text-xs text-slate-400">
              Last 6 months
            </span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stockData.length > 0 ? stockData : [{ name: 'No Data', stock: 0 }]}>
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package size={16} className="text-emerald-500" />
            <span className="text-sm font-semibold text-slate-700">
              Stock by Category
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="h-52 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData.length > 0 ? categoryData : [{ name: 'No Data', value: 100 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(categoryData.length > 0 ? categoryData : [{ name: 'No Data', value: 100 }]).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: "none",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 shrink-0">
              {(categoryData.length > 0 ? categoryData : [{ name: 'No Data', value: 100 }]).map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-slate-600"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
