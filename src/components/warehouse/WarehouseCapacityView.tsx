import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCapacityStats } from "@/store/slices/warehouseSlice";
import { productService } from "@/services/productService";
import { InventoryItem } from "@/types";
import {
  BarChart3,
  Info,
  Loader2,
  AlertCircle,
  Package,
  RefreshCw,
  TrendingUp,
  Layers,
  ArrowRight,
  MapPin,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Shadcn UI (Visual consistent with other pages)
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const WarehouseCapacityView: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { capacityStats: stats, loading, error } = useAppSelector(
    (state) => state.warehouse,
  );
  const [linkedItem, setLinkedItem] = useState<InventoryItem | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  const handleRefresh = () => {
    dispatch(fetchCapacityStats());
    setLastUpdated(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    handleRefresh();
    // Auto refresh every 5 minutes for "real-time" feel
    const interval = setInterval(handleRefresh, 300000);
    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    const sku = searchParams.get("sku");
    const itemId = searchParams.get("item");
    if (!sku && !itemId) {
      setLinkedItem(null);
      return;
    }

    const loadLinkedItem = async () => {
      try {
        const items = await productService.getAllItems();
        setLinkedItem(
          items.find((item) => item.id === itemId || item.sku === sku) || null,
        );
      } catch (err) {
        console.error("Failed to load linked item", err);
      }
    };

    loadLinkedItem();
  }, [searchParams]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Facility Capacity</h1>
          <p className="text-slate-500 mt-1 text-lg">Real-time utilization metrics aggregated from live bin data.</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-400 font-medium hidden sm:block">Last updated: {lastUpdated}</p>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading}
            className="rounded-xl shadow-sm hover:shadow-md transition-all h-11 px-6"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> 
            Refresh Data
          </Button>
        </div>
      </div>

      {linkedItem && (
        <Card className="border-blue-100 bg-blue-50/30 overflow-hidden shadow-none">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white p-3 text-blue-600 shadow-sm border border-blue-50">
                <Package size={24} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-blue-950">{linkedItem.name}</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      SKU <span className="font-mono font-bold">{linkedItem.sku}</span> is linked with {linkedItem.stock} {linkedItem.stockUom || linkedItem.uom || "units"} total stock.
                    </p>
                  </div>
                  <Badge className="bg-white text-blue-600 hover:bg-white border-blue-100">Linked Context</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(linkedItem.stocks || []).length === 0 ? (
                    <span className="rounded-lg bg-white/50 px-3 py-1.5 text-xs text-blue-700 border border-blue-100/50 italic">
                      No active warehouse stock rows found
                    </span>
                  ) : (
                    (linkedItem.stocks || []).map((stock, index) => (
                      <div key={index} className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 shadow-sm border border-blue-50 text-xs font-bold text-blue-800">
                        <MapPin size={12} className="text-blue-400" />
                        WH {String(stock.warehouseId).slice(-6)}: {stock.quantity}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && stats.length === 0 ? (
        <div className="py-32 text-center">
          <Loader2 className="animate-spin inline text-blue-600 mb-4" size={48} />
          <p className="text-slate-500 font-bold text-lg">Aggregating facility data across network...</p>
          <p className="text-sm text-slate-400 mt-2">Connecting to live bin sensors and inventory logs.</p>
        </div>
      ) : error ? (
        <Card className="border-red-100 bg-red-50 shadow-none">
          <CardContent className="p-8 flex items-center gap-4 text-red-700">
            <div className="p-3 bg-white rounded-2xl shadow-sm text-red-500">
              <AlertCircle size={32} />
            </div>
            <div>
              <p className="text-xl font-bold">Aggregation Failed</p>
              <p className="opacity-90">{error}</p>
              <Button variant="link" className="p-0 h-auto text-red-700 font-bold mt-2" onClick={handleRefresh}>Try again</Button>
            </div>
          </CardContent>
        </Card>
      ) : stats.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50 shadow-none">
          <CardContent className="py-32 text-center">
            <div className="p-4 bg-white rounded-3xl shadow-sm inline-block mb-6 text-slate-200 border border-slate-100">
              <BarChart3 size={64} />
            </div>
            <p className="text-slate-500 font-bold text-xl">No storage hierarchy detected.</p>
            <p className="text-slate-400 max-w-sm mx-auto mt-2">
              You haven't defined any Zones or Bins yet. Real-time utilization requires a mapped storage structure.
            </p>
            <Button variant="outline" className="mt-8 rounded-xl h-11 px-6 shadow-sm">Setup Storage Hierarchy</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {stats.map((wh: any) => (
            <Card key={wh.warehouseId} className="group border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden bg-white">
              <div className={`h-1.5 w-full ${wh.utilizationRate > 85 ? 'bg-red-500' : 'bg-blue-600'}`} />
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                      <Building2 size={20} className="hidden" />
                      <BarChart3 size={20} />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-800">{wh.warehouseName}</CardTitle>
                  </div>
                  <Badge className={`px-3 py-1 rounded-lg font-bold text-xs uppercase tracking-wider border-none ${wh.utilizationRate > 85 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {wh.utilizationRate}% Capacity
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-8">
                {/* Overall Utilization Metric */}
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Occupancy Status</p>
                      <p className="text-sm font-bold text-slate-700">
                        {wh.occupiedBins} <span className="text-slate-400 font-medium">/ {wh.totalBins} Active Bins</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-500">Available</p>
                      <p className="text-sm font-bold text-slate-700">{wh.totalBins - wh.occupiedBins}</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.3)] ${wh.utilizationRate > 85 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`} 
                      style={{width: `${wh.utilizationRate}%`}}
                    />
                  </div>
                </div>

                {/* Zone Breakdown */}
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Layers size={16} className="text-blue-500" /> Zone Utilization
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Volume Metrics</span>
                  </div>
                  
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={wh.zoneStats} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="zoneName" 
                          type="category" 
                          width={100} 
                          tick={{ fontSize: 11, fontWeight: 700, fill: "#475569" }} 
                          axisLine={false} 
                          tickLine={false} 
                        />
                        <Tooltip 
                          cursor={{ fill: "rgba(241, 245, 249, 0.5)" }}
                          contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)", padding: "12px" }}
                        />
                        <Bar dataKey="capacity" name="Total Capacity" fill="#e2e8f0" barSize={20} radius={[0, 4, 4, 0]} />
                        <Bar dataKey="used" name="Occupied" fill="#3b82f6" barSize={20} radius={[0, 4, 4, 0]}>
                           {wh.zoneStats.map((entry: any, index: number) => (
                             <Cell key={`cell-${index}`} fill={entry.used / entry.capacity > 0.85 ? '#ef4444' : '#3b82f6'} />
                           ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Insights Footer */}
      <Card className="border-none bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden shadow-xl shadow-slate-200">
        <CardContent className="p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <TrendingUp size={160} />
          </div>
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center relative z-10">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
              <TrendingUp className="text-blue-400" size={32} />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold">Optimization Insights</h4>
              <p className="text-slate-300 mt-2 leading-relaxed max-w-2xl">
                Our AI-driven facility monitor indicates that your storage network is operating at <span className="text-white font-bold">optimal efficiency</span>. 
                Warehouses exceeding 85% utilization are automatically flagged for zone redistribution to prevent operational bottlenecks.
              </p>
            </div>
            <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl h-12 px-8">
              Review Alerts <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Building2 = ({ size, className }: { size: number, className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>
    </svg>
)

export default WarehouseCapacityView;
