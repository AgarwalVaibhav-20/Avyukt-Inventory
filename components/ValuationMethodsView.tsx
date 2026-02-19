import React, { useState, useEffect } from 'react';
import { stockControlService } from '../services/stockControlService';
import { Settings, CheckCircle2, ArrowRightLeft, Info, Loader2 } from 'lucide-react';

const ValuationMethodsView: React.FC = () => {
  const [method, setMethod] = useState<'FIFO' | 'LIFO' | 'Avg'>('FIFO');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const m = await stockControlService.getValuationMethod();
    setMethod(m);
    setLoading(false);
  };

  const handleSave = async (m: 'FIFO' | 'LIFO' | 'Avg') => {
      setSaving(true);
      await stockControlService.setValuationMethod(m);
      setMethod(m);
      setSaving(false);
  };

  const methods = [
      { id: 'FIFO', label: 'First In, First Out (FIFO)', desc: 'Inventory items acquired first are sold or used first. Suitable for perishable goods.', color: 'border-green-200 bg-green-50' },
      { id: 'LIFO', label: 'Last In, First Out (LIFO)', desc: 'Items acquired last are sold first. Often used for non-perishable goods or specific tax strategies.', color: 'border-orange-200 bg-orange-50' },
      { id: 'Avg', label: 'Weighted Average Cost', desc: 'Cost of goods available for sale divided by units available. Smooths out price fluctuations.', color: 'border-blue-200 bg-blue-50' },
  ];

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Settings className="text-slate-600" size={20}/> Inventory Valuation Method
            </h2>
            <p className="text-sm text-slate-500 mb-6">Select the standard costing method used for financial reporting and stock value calculation.</p>

            {loading ? <div className="py-8 text-center"><Loader2 className="animate-spin inline"/> Loading settings...</div> : (
                <div className="grid gap-4">
                    {methods.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => handleSave(m.id as any)}
                            disabled={saving}
                            className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left relative ${method === m.id ? `${m.color} ${m.color.replace('bg-', 'border-')}` : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                        >
                            <div className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center ${method === m.id ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                                {method === m.id && <div className="w-2 h-2 bg-white rounded-full"/>}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-800">{m.label}</h3>
                                <p className="text-sm text-slate-500 mt-1">{m.desc}</p>
                            </div>
                            {method === m.id && <CheckCircle2 className="text-blue-600 absolute top-4 right-4" size={20}/>}
                        </button>
                    ))}
                </div>
            )}

            <div className="mt-6 bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-start gap-3">
                <Info className="text-blue-500 shrink-0 mt-0.5" size={18}/>
                <p className="text-xs text-slate-600">
                    Changing the valuation method will trigger a recalculation of current inventory value. 
                    Historical reports (Closing Stock) will retain their original valuation method at the time of generation.
                </p>
            </div>
        </div>
    </div>
  );
};

export default ValuationMethodsView;
