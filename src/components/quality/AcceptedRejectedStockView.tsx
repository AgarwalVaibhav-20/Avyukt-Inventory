import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { qualityService } from '@/services/qualityService';
import { procurementService } from '@/services/procurementService';
import { GRN } from '@/types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle, XCircle, Search, Loader2 } from 'lucide-react';

const AcceptedRejectedStockView: React.FC = () => {
  const [grns, setGRNs] = useState<GRN[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ accepted: 0, rejected: 0, pending: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await procurementService.getAllGRNs();
    setGRNs(data);
    
    // Calculate stats from all items in all GRNs
    let acc = 0, rej = 0, pend = 0;
    data.forEach(g => {
        g.items.forEach(i => {
            acc += i.acceptedQty || 0;
            rej += i.rejectedQty || 0;
            if(g.status === 'Pending QC') pend += i.receivedQty;
        });
    });
    setStats({ accepted: acc, rejected: rej, pending: pend });
    setLoading(false);
  };

  const chartData = [
      { name: 'Accepted', value: stats.accepted, color: '#22c55e' },
      { name: 'Rejected', value: stats.rejected, color: '#ef4444' },
      { name: 'Pending', value: stats.pending, color: '#f59e0b' }
  ];

  const handleRaiseNCR = async (row: any) => {
      try {
          await qualityService.createNCR({
              itemId: row.materialId || row.productId || row._id || '',
              quantity: row.rejectedQty,
              refType: 'GRN',
              refId: row.grnNo,
              description: `System generated NCR for rejected quantity in GRN ${row.grnNo}`
          });
          alert('NCR raised successfully. You can view it in the NCR tab.');
      } catch(e: any) {
          alert('Failed to raise NCR: ' + e.message);
      }
  };

  const handleRework = async (row: any) => {
      try {
          await qualityService.createReworkEntry({
              itemId: row.materialId || row.productId || row._id || '',
              quantity: row.rejectedQty,
              reason: `Rejected during QC of GRN ${row.grnNo}`
          });
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
            <div className="p-4 border-b bg-slate-50">
                <h3 className="font-semibold text-slate-800">Inspection History Log</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">GRN No</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Item</th>
                            <th className="px-6 py-4 text-right">Received</th>
                            <th className="px-6 py-4 text-right text-green-600">Accepted</th>
                            <th className="px-6 py-4 text-right text-red-600">Rejected</th>
                            <th className="px-6 py-4">Remarks</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={7} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> : 
                         grns.flatMap(g => g.items.map((i, idx) => ({...i, grnNo: g.grnNumber, date: g.date, key: `${g.id}-${idx}`})))
                             .filter(i => i.acceptedQty > 0 || i.rejectedQty > 0)
                             .map(row => (
                                <tr key={row.key} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium">{row.grnNo}</td>
                                    <td className="px-6 py-4 text-slate-500">{row.date}</td>
                                    <td className="px-6 py-4">{row.itemName}</td>
                                    <td className="px-6 py-4 text-right font-medium">{row.receivedQty}</td>
                                    <td className="px-6 py-4 text-right text-green-600 font-bold bg-green-50">{row.acceptedQty}</td>
                                    <td className="px-6 py-4 text-right text-red-600 font-bold bg-red-50">{row.rejectedQty}</td>
                                    <td className="px-6 py-4 text-slate-500 truncate max-w-xs">{row.qcRemarks || '-'}</td>
                                    <td className="px-6 py-4 text-center">
                                        {row.rejectedQty > 0 ? (
                                            <div className="flex justify-center gap-3">
                                                <button 
                                                    onClick={() => handleRaiseNCR(row)}
                                                    className="text-xs font-medium text-red-600 hover:text-red-800 hover:underline"
                                                >
                                                    Raise NCR
                                                </button>
                                                <button 
                                                    onClick={() => handleRework(row)}
                                                    className="text-xs font-medium text-orange-600 hover:text-orange-800 hover:underline"
                                                >
                                                    Rework
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400">-</span>
                                        )}
                                    </td>
                                </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default AcceptedRejectedStockView;
