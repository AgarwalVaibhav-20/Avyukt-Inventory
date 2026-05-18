import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { qualityService } from '@/services/qualityService';
import { procurementService } from '@/services/procurementService';
import { GRN, NCR, ReworkEntry } from '@/types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle, XCircle, Search, Loader2, ShieldAlert, Wrench } from 'lucide-react';

const AcceptedRejectedStockView: React.FC = () => {
  const [grns, setGRNs] = useState<GRN[]>([]);
  const [ncrs, setNcrs] = useState<NCR[]>([]);
  const [reworks, setReworks] = useState<ReworkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ accepted: 0, rejected: 0, pending: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [resultFilter, setResultFilter] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [grnData, ncrData, rwData] = await Promise.all([
        procurementService.getAllGRNs(),
        qualityService.getNCRs().catch(() => []),
        qualityService.getReworkEntries().catch(() => [])
      ]);
      
      setGRNs(grnData);
      setNcrs(ncrData);
      setReworks(rwData);
      
      // Calculate stats from all items in all GRNs
      let acc = 0, rej = 0, pend = 0;
      grnData.forEach(g => {
          g.items.forEach(i => {
              acc += i.acceptedQty || 0;
              rej += i.rejectedQty || 0;
              if(g.status === 'Pending QC') pend += i.receivedQty;
          });
      });
      setStats({ accepted: acc, rejected: rej, pending: pend });
    } catch (e) {
      console.error("Error loading inspection data", e);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
      { name: 'Accepted', value: stats.accepted, color: '#22c55e' },
      { name: 'Rejected', value: stats.rejected, color: '#ef4444' },
      { name: 'Pending', value: stats.pending, color: '#f59e0b' }
  ];

  const inspectionRows = grns
      .flatMap(g => g.items.map((i, idx) => ({...i, grnNo: g.grnNumber, date: g.date, key: `${g.id}-${idx}`})))
      .filter(i => i.acceptedQty > 0 || i.rejectedQty > 0)
      .filter((row) => {
          const term = searchTerm.trim().toLowerCase();
          const matchesSearch =
              !term ||
              row.grnNo.toLowerCase().includes(term) ||
              (row.itemName || '').toLowerCase().includes(term) ||
              (row.qcRemarks || '').toLowerCase().includes(term);
          const matchesResult =
              resultFilter === 'All' ||
              (resultFilter === 'Accepted' && row.acceptedQty > 0) ||
              (resultFilter === 'Rejected' && row.rejectedQty > 0);
          return matchesSearch && matchesResult;
      });

  const handleRaiseNCR = async (row: any) => {
      try {
          const newNcr = await qualityService.createNCR({
              itemId: row.materialId || row.productId || row._id || '',
              itemName: row.itemName || 'Unknown Item',
              quantity: row.rejectedQty,
              refType: 'GRN',
              refId: row.grnNo,
              description: `System generated NCR for rejected quantity in GRN ${row.grnNo}`
          });
          setNcrs(prev => [...prev, newNcr]);
          alert('NCR raised successfully. You can view it in the NCR tab.');
      } catch(e: any) {
          alert('Failed to raise NCR: ' + e.message);
      }
  };

  const handleRework = async (row: any) => {
      try {
          const newRw = await qualityService.createReworkEntry({
              itemId: row.materialId || row.productId || row._id || '',
              itemName: row.itemName || 'Unknown Item',
              quantity: row.rejectedQty,
              reason: `Rejected during QC of GRN ${row.grnNo}`
          });
          setReworks(prev => [...prev, newRw]);
          alert('Sent to Rework successfully. You can view it in the Rework tab.');
      } catch(e: any) {
          alert('Failed to send to rework: ' + e.message);
      }
  };

  return (
    <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-green-100 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">Total Accepted</p>
                    <h3 className="text-2xl font-bold text-green-600">{stats.accepted}</h3>
                </div>
                <CheckCircle className="text-green-500 opacity-20" size={40}/>
            </div>
            <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">Total Rejected</p>
                    <h3 className="text-2xl font-bold text-red-600">{stats.rejected}</h3>
                </div>
                <XCircle className="text-red-500 opacity-20" size={40}/>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between h-40">
                 <div className="w-full h-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                     </ResponsiveContainer>
                 </div>
            </div>
        </div>

        {/* Detailed List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex flex-col gap-4 border-b bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                <h3 className="font-semibold text-slate-800">Inspection History Log</h3>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search GRN, item, remarks..." className="w-full rounded-lg border py-2 pl-9 pr-4 text-sm md:w-72" />
                    </div>
                    <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
                        <option value="All">All Results</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">GRN No</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Item</th>
                            <th className="px-6 py-4 text-right">Received</th>
                            <th className="px-6 py-4 text-right text-green-600">Accepted</th>
                            <th className="px-6 py-4 text-right text-red-600">Rejected</th>
                            <th className="px-6 py-4">Remarks</th>
                            <th className="px-6 py-4 text-center">Actions / Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {loading ? <tr><td colSpan={8} className="py-8 text-center"><Loader2 className="animate-spin inline text-blue-600" size={24}/></td></tr> :
                         inspectionRows.length === 0 ? <tr><td colSpan={8} className="py-8 text-center text-slate-500 font-medium">No inspection records found.</td></tr> :
                         inspectionRows.map(row => {
                             // Check if NCR or Rework has been raised for this GRN Item
                             const hasNcr = ncrs.some(n => n.refId === row.grnNo && (n.itemId === row.materialId || n.itemId === row.productId || n.itemId === row._id || n.itemName === row.itemName));
                             const hasRework = reworks.some(r => r.reason?.includes(row.grnNo) || r.itemName === row.itemName);

                             return (
                                <tr key={row.key} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-900">{row.grnNo}</td>
                                    <td className="px-6 py-4 text-slate-500 font-medium">{row.date}</td>
                                    <td className="px-6 py-4 font-semibold text-slate-800">{row.itemName}</td>
                                    <td className="px-6 py-4 text-right font-medium">{row.receivedQty}</td>
                                    <td className="px-6 py-4 text-right text-green-600 font-black bg-green-50/50">{row.acceptedQty}</td>
                                    <td className="px-6 py-4 text-right text-red-600 font-black bg-red-50/50">{row.rejectedQty}</td>
                                    <td className="px-6 py-4 text-slate-500 truncate max-w-xs font-medium">{row.qcRemarks || '-'}</td>
                                    <td className="px-6 py-4 text-center">
                                        {row.rejectedQty > 0 ? (
                                            <div className="flex justify-center items-center gap-2 flex-wrap">
                                                {hasNcr ? (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-xs font-bold text-red-700 shadow-sm animate-fade-in">
                                                        <ShieldAlert size={14} /> NCR Raised
                                                    </span>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleRaiseNCR(row)}
                                                        className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-600 hover:bg-red-100 transition shadow-sm"
                                                    >
                                                        Raise NCR
                                                    </button>
                                                )}

                                                {hasRework ? (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-700 shadow-sm animate-fade-in">
                                                        <Wrench size={14} /> Sent to Rework
                                                    </span>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleRework(row)}
                                                        className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-600 hover:bg-amber-100 transition shadow-sm"
                                                    >
                                                        Rework
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 font-bold">-</span>
                                        )}
                                    </td>
                                </tr>
                             );
                         })}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default AcceptedRejectedStockView;
