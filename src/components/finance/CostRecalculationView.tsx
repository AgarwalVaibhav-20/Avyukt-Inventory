import React, { useState } from 'react';
import { stockControlService } from '@/services/stockControlService';
import { RefreshCcw, CheckCircle, AlertTriangle } from 'lucide-react';

const CostRecalculationView: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [lastRun, setLastRun] = useState<string | null>(null);

  const handleRun = async () => {
      setStatus('processing');
      const time = await stockControlService.recalculateCosts();
      setStatus('success');
      setLastRun(time);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <RefreshCcw size={32} className={`text-blue-600 ${status === 'processing' ? 'animate-spin' : ''}`}/>
            </div>
            
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Cost Recalculation Utility</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
                Trigger a manual recalculation of item costs based on the selected valuation method (FIFO/LIFO/Avg). 
                This processes all historical transactions to ensure accuracy.
            </p>

            {status === 'idle' && (
                <button 
                    onClick={handleRun}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-shadow shadow-lg shadow-blue-200"
                >
                    Run Recalculation
                </button>
            )}

            {status === 'processing' && (
                <div className="space-y-3">
                    <p className="text-blue-600 font-medium animate-pulse">Processing stock ledger...</p>
                    <div className="w-64 h-2 bg-slate-100 rounded-full mx-auto overflow-hidden">
                        <div className="h-full bg-blue-500 animate-progress"></div>
                    </div>
                </div>
            )}

            {status === 'success' && (
                <div className="animate-fade-in">
                    <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-lg mb-2">
                        <CheckCircle size={24}/> Recalculation Complete
                    </div>
                    <p className="text-slate-400 text-sm">Last successful run: {lastRun}</p>
                    <button onClick={() => setStatus('idle')} className="mt-6 text-blue-600 text-sm hover:underline">Run Again</button>
                </div>
            )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20}/>
            <div>
                <h4 className="font-bold text-amber-800 text-sm">System Note</h4>
                <p className="text-xs text-amber-700 mt-1">
                    Running this utility during peak hours may affect system performance. It is recommended to perform cost recalculation during maintenance windows or off-peak times.
                </p>
            </div>
        </div>
    </div>
  );
};

export default CostRecalculationView;
