import React, { useState, useEffect } from "react";
import { stockControlService } from "@/services/stockControlService";
import {
  DollarSign,
  TrendingUp,
  Activity,
  ArrowDownRight,
  Calculator,
  Receipt,
  Calendar,
  Box,
  ShieldCheck,
  Loader2,
  Search,
  Filter,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";

const COGSView: React.FC = () => {
  const [cogsData, setCogsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCOGS();
  }, []);

  const fetchCOGS = async () => {
    setLoading(true);
    try {
      const data = await stockControlService.getCOGSData();
      setCogsData(data);
    } catch (error) {
      toast.error("Failed to load COGS ledger");
    }
    setLoading(false);
  };

  const totalCOGS = cogsData.reduce((sum, item) => sum + item.totalCost, 0);

  const handleRunValuation = async () => {
    toast.promise(fetchCOGS(), {
      loading: "Recalculating inventory valuation impact...",
      success: "Valuation refreshed successfully",
      error: "Failed to run valuation",
    });
  };

  const filteredData = cogsData.filter(
    (entry) =>
      entry.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* Financial Header */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 p-10 relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/20 shadow-2xl">
                <Calculator className="text-emerald-300" size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                  COGS Ledger
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30 font-black uppercase tracking-widest">
                    Financial Postings
                  </span>
                </h2>
                <p className="text-emerald-200/70 font-medium mt-1 text-lg">
                  Cost of Goods Sold tracking for every dispatch event
                </p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 min-w-[250px]">
              <p className="text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-1">
                Total COGS (MTD)
              </p>
              <p className="text-3xl font-black text-white">
                ₹{totalCOGS.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="p-10">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-10">
            <div className="relative flex-1 max-w-2xl">
              <Search
                className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by Dispatch Ref or Item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-base font-bold focus:bg-white focus:border-emerald-500/20 focus:ring-8 focus:ring-emerald-500/5 transition-all outline-none"
              />
            </div>
            <div className="flex gap-4">
              <button className="p-4 bg-slate-50 rounded-2xl text-slate-500 hover:text-emerald-600 transition-colors">
                <Filter size={20} />
              </button>
              <button
                onClick={handleRunValuation}
                className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
              >
                Run Valuation
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border-2 border-slate-100 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Financial Ref
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Item Details
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                      Units Dispatched
                    </th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                      Unit Cost
                    </th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                      Total COGS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-32 text-center">
                        <Loader2
                          className="animate-spin text-emerald-600 mx-auto mb-4"
                          size={48}
                        />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                          Calculating Financial Impact...
                        </p>
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-32 text-center">
                        <Receipt
                          size={64}
                          className="mx-auto mb-4 text-slate-200"
                        />
                        <p className="text-slate-400 font-bold italic">
                          No COGS entries found.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((entry) => (
                      <tr
                        key={entry.id}
                        className="group hover:bg-emerald-50/30 transition-all duration-300"
                      >
                        <td className="px-10 py-7">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-lg tracking-tighter group-hover:text-emerald-700 transition-colors">
                              {entry.reference}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                              <Calendar size={12} /> {entry.date}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-7">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                              <Box size={20} className="text-slate-400" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-slate-800 text-base leading-none mb-1">
                                {entry.itemName}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                {entry.sku}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-7 text-right">
                          <span className="font-black text-slate-900 text-lg">
                            {entry.quantity}
                          </span>
                        </td>
                        <td className="px-8 py-7 text-right">
                          <span className="font-bold text-slate-500">
                            ₹{entry.unitCost.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-10 py-7 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-black text-emerald-700 text-xl tracking-tighter">
                              ₹{entry.totalCost.toLocaleString()}
                            </span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-black uppercase tracking-widest mt-1">
                              POSTED
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Notice */}
      {/* <div className="bg-emerald-50 rounded-[2.5rem] border border-emerald-100 p-10 flex flex-col md:flex-row gap-10 items-center">
            <div className="w-20 h-20 bg-emerald-600 rounded-[2rem] flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                <Receipt className="text-white" size={40}/>
            </div>
            <div className="flex-1">
                <h4 className="text-xl font-black text-emerald-950 mb-2 uppercase tracking-tight">Revenue Recognition & Cost Matching</h4>
                <p className="text-emerald-800/70 text-base font-medium leading-relaxed">
                    The Cost of Goods Sold (COGS) is automatically posted to the general ledger upon dispatch confirmation. 
                    The system uses the <span className="font-black text-emerald-700 underline decoration-emerald-300 underline-offset-4">Weighted Average Cost</span> method to calculate the valuation impact of each SKU deduction.
                </p>
            </div>
            <button className="bg-emerald-950 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-emerald-900 transition-all">
                Accounting Settings
            </button>
        </div> */}
    </div>
  );
};

export default COGSView;
