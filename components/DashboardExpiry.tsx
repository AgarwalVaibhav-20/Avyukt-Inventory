import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import { Batch } from '../types';
import { CalendarX, AlertTriangle, Loader2 } from 'lucide-react';

const DashboardExpiry: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await dashboardService.getExpiryAlerts();
    setBatches(data);
    setLoading(false);
  };

  const today = new Date();

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={20}/> Expiry Alerts
            </h2>
            <p className="text-sm text-slate-500 mb-6">Items expired or expiring within the next 30 days.</p>

            {loading ? <div className="text-center py-8"><Loader2 className="animate-spin inline"/> Loading...</div> : 
             batches.length === 0 ? <p className="text-center text-slate-500 py-8 bg-green-50 rounded-lg">No stock expiry risks detected.</p> :
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {batches.map(b => {
                     const expDate = new Date(b.expiryDate);
                     const isExpired = expDate < today;
                     const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

                     return (
                         <div key={b.id} className={`border rounded-lg p-4 ${isExpired ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                             <div className="flex justify-between items-start mb-2">
                                 <span className="font-mono text-xs font-bold text-slate-700 bg-white/50 px-2 py-1 rounded">{b.batchNumber}</span>
                                 <span className={`text-xs font-bold px-2 py-1 rounded-full ${isExpired ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'}`}>
                                     {isExpired ? 'EXPIRED' : `${diffDays} Days Left`}
                                 </span>
                             </div>
                             <h4 className="font-bold text-slate-800 mb-1">{b.itemName}</h4>
                             <div className="text-xs text-slate-600 flex justify-between mt-2">
                                 <span>Qty: <span className="font-bold">{b.quantity}</span></span>
                                 <span className="font-medium text-slate-800">{b.expiryDate}</span>
                             </div>
                         </div>
                     );
                 })}
             </div>
            }
        </div>
    </div>
  );
};

export default DashboardExpiry;
