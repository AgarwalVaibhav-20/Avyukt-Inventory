import React, { useState, useEffect } from 'react';
import { dashboardService } from '@/services/dashboardService';
import { ApprovalItem } from '@/types';
import { CheckCircle, Clock, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

const DashboardApprovals: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await dashboardService.getPendingApprovals();
    setApprovals(data);
    setLoading(false);
  };

  const handleApprove = (id: string) => {
      // Mock approval action
      alert(`Approved item ${id}`);
      setApprovals(approvals.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                <CheckCircle className="text-green-600" size={20}/> Pending Approvals
            </h2>
            <p className="text-sm text-slate-500 mb-6">Review and approve pending Purchase Orders, GRN Quality Checks, and Stock Transfers.</p>

            {loading ? <div className="text-center py-8"><Loader2 className="animate-spin inline"/> Loading...</div> : 
             approvals.length === 0 ? <p className="text-center text-slate-500 py-8">No pending approvals.</p> :
             <div className="space-y-4">
                 {approvals.map(item => (
                     <div key={item.id} className="border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow bg-slate-50">
                         <div className="flex items-start gap-3">
                             <div className={`p-2 rounded-full mt-1 ${item.type.includes('Order') ? 'bg-blue-100 text-blue-600' : item.type.includes('QC') ? 'bg-amber-100 text-amber-600' : 'bg-purple-100 text-purple-600'}`}>
                                 <Clock size={20}/>
                             </div>
                             <div>
                                 <h4 className="font-bold text-slate-800">{item.type} <span className="font-normal text-slate-500">#{item.reference}</span></h4>
                                 <p className="text-sm text-slate-600">{item.initiator} • {item.date}</p>
                                 <p className="text-xs text-slate-500 mt-1">{item.details}</p>
                             </div>
                         </div>
                         <div className="flex items-center gap-3 w-full md:w-auto">
                             <span className="text-xs font-semibold px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-600">
                                 {item.status}
                             </span>
                             <button 
                                onClick={() => handleApprove(item.id)}
                                className="flex-1 md:flex-none bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                             >
                                 Approve
                             </button>
                         </div>
                     </div>
                 ))}
             </div>
            }
        </div>
    </div>
  );
};

export default DashboardApprovals;
