import React, { useState, useEffect } from 'react';
import { returnsService } from '@/services/returnsService';
import { ReplacementOrder } from '@/types';
import { RefreshCcw, Loader2, Truck, ArrowRight, ArrowLeft } from 'lucide-react';

const ReplacementHandlingView: React.FC = () => {
  const [replacements, setReplacements] = useState<ReplacementOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await returnsService.getReplacements();
    setReplacements(data);
    setLoading(false);
  };

  const handleShip = async (id: string) => {
      await returnsService.updateReplacementStatus(id, 'Shipped');
      loadData();
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <RefreshCcw className="text-amber-600" size={20}/> Replacement Orders
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? <div className="col-span-3 text-center"><Loader2 className="animate-spin inline"/></div> :
                 replacements.length === 0 ? <div className="col-span-3 text-center text-slate-500">No active replacements.</div> :
                 replacements.map(rep => (
                    <div key={rep.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-slate-700">{rep.reference}</span>
                            <span className={`text-xs px-2 py-1 rounded font-medium ${rep.status === 'Shipped' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {rep.status}
                            </span>
                        </div>
                        
                        <div className="text-sm text-slate-600 mb-3 space-y-1">
                            <p className="flex items-center gap-2">
                                {rep.type === 'Customer' ? <ArrowRight size={14} className="text-blue-500"/> : <ArrowLeft size={14} className="text-green-500"/>}
                                {rep.type === 'Customer' ? 'Sending to Customer' : 'Receiving from Vendor'}
                            </p>
                            <p className="font-medium text-slate-800">{rep.quantity} x {rep.itemName}</p>
                            <p className="text-xs text-slate-400">Ref Return: {rep.originalReturnId}</p>
                        </div>

                        {rep.status === 'Pending' && rep.type === 'Customer' && (
                            <button 
                                onClick={() => handleShip(rep.id)}
                                className="w-full bg-blue-600 text-white text-xs py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                            >
                                <Truck size={14}/> Dispatch Replacement
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default ReplacementHandlingView;
