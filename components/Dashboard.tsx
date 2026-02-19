import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { AlertTriangle, TrendingUp, Package, Activity, Sparkles, RefreshCcw } from 'lucide-react';
import { MOCK_INVENTORY } from '../constants';
import { getInventoryInsights } from '../services/geminiService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard: React.FC = () => {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    // Initial AI Load
    handleGenerateInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateInsight = async () => {
    setLoadingAi(true);
    const result = await getInventoryInsights(MOCK_INVENTORY);
    setAiInsight(result);
    setLoadingAi(false);
  };

  // Mock Chart Data
  const stockData = [
    { name: 'Jan', stock: 4000 },
    { name: 'Feb', stock: 3500 },
    { name: 'Mar', stock: 5000 },
    { name: 'Apr', stock: 4800 },
    { name: 'May', stock: 6000 },
  ];

  const categoryData = [
    { name: 'Components', value: 400 },
    { name: 'Machinery', value: 300 },
    { name: 'Safety', value: 300 },
    { name: 'Raw Mat', value: 200 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
                <p className="text-slate-500 text-sm font-medium">Total Inventory Value</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-2">$1.2M</h3>
                <span className="text-green-500 text-xs font-medium flex items-center mt-1">
                    <TrendingUp size={12} className="mr-1" /> +2.5% vs last month
                </span>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                <Activity size={24} />
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
                <p className="text-slate-500 text-sm font-medium">Low Stock Items</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-2">12</h3>
                <span className="text-red-500 text-xs font-medium flex items-center mt-1">
                    <AlertTriangle size={12} className="mr-1" /> Action Required
                </span>
            </div>
            <div className="p-3 bg-red-50 rounded-lg text-red-600">
                <AlertTriangle size={24} />
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
                <p className="text-slate-500 text-sm font-medium">Active Purchase Orders</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-2">8</h3>
                <span className="text-slate-400 text-xs mt-1">
                    3 Pending Approval
                </span>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
                <Package size={24} />
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
                <p className="text-slate-500 text-sm font-medium">Stock Turnover Rate</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-2">4.2</h3>
                <span className="text-green-500 text-xs font-medium flex items-center mt-1">
                     Healthy
                </span>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                <RefreshCcw size={24} />
            </div>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles size={120} />
        </div>
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="text-yellow-400" size={20}/> 
                    Gemini AI Inventory Analyst
                </h2>
                <button 
                    onClick={handleGenerateInsight}
                    disabled={loadingAi}
                    className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors flex items-center gap-1"
                >
                    <RefreshCcw size={12} className={loadingAi ? 'animate-spin' : ''} />
                    {loadingAi ? 'Analyzing...' : 'Refresh Insights'}
                </button>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm min-h-[100px]">
                {aiInsight ? (
                    <div 
                        className="prose prose-invert prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: aiInsight }} 
                    />
                ) : (
                    <p className="text-sm text-indigo-200">Initializing AI model to analyze stock levels...</p>
                )}
            </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Valuation Trend */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Stock Value Trend (Last 5 Months)</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stockData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="stock" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6'}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Stock Value by Category</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                    {categoryData.map((entry, index) => (
                        <div key={index} className="flex items-center gap-1 text-xs text-slate-600">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            {entry.name}
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
