import React, { useState, useEffect } from 'react';
import { returnsService } from '@/services/returnsService';
import { ReplacementOrder } from '@/types';
import { RefreshCcw, Loader2, Truck, ArrowRight, ArrowLeft, Package2, Ship, RotateCcw } from 'lucide-react';

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

  const pendingCount = replacements.filter((rep) => rep.status === 'Pending').length;
  const shippedCount = replacements.filter((rep) => rep.status === 'Shipped' || rep.status === 'Dispatched').length;
  const deliveredCount = replacements.filter((rep) => rep.status === 'Delivered').length;

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 p-0">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">
                        <RefreshCcw size={14} />
                        Replacement Handling
                    </div>
                    <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                        Replacement dispatch control for returned goods
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                        Track each replacement request from return reference to shipping status, with the operational handoff kept separate from the financial note flow.
                    </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pending</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{pendingCount}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Shipped</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{shippedCount}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Delivered</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{deliveredCount}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                        <Package2 size={20} />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Return reference</p>
                        <p className="text-lg font-bold text-slate-900">Links to original return</p>
                    </div>
                </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                        <Ship size={20} />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Dispatch action</p>
                        <p className="text-lg font-bold text-slate-900">Single-click shipping</p>
                    </div>
                </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                        <RotateCcw size={20} />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Workflow</p>
                        <p className="text-lg font-bold text-slate-900">Customer replacement only</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
                <h3 className="text-xl font-black text-slate-900">Replacement orders</h3>
                <p className="mt-1 text-sm text-slate-500">Use the action button to mark pending replacements as shipped.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {loading ? <div className="col-span-full py-10 text-center"><Loader2 className="inline animate-spin"/></div> :
                 replacements.length === 0 ? <div className="col-span-full py-10 text-center text-slate-500">No active replacements.</div> :
                 replacements.map(rep => (
                    <div key={rep.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <div className="mb-3 flex items-start justify-between gap-4">
                            <span className="font-black text-slate-900">{rep.reference}</span>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${rep.status === 'Shipped' ? 'bg-emerald-100 text-emerald-700' : rep.status === 'Delivered' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                {rep.status}
                            </span>
                        </div>
                        
                        <div className="mb-4 space-y-2 text-sm text-slate-600">
                            <p className="flex items-center gap-2">
                                {rep.type === 'Customer' ? <ArrowRight size={14} className="text-blue-500"/> : <ArrowLeft size={14} className="text-green-500"/>}
                                {rep.type === 'Customer' ? 'Sending to Customer' : 'Receiving from Vendor'}
                            </p>
                            <p className="font-semibold text-slate-800">{rep.quantity} x {rep.itemName}</p>
                            <p className="text-xs text-slate-400">Return ID: {rep.originalReturnId}</p>
                        </div>

                        {rep.status === 'Pending' && rep.type === 'Customer' && (
                            <button 
                                onClick={() => handleShip(rep.id)}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
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
