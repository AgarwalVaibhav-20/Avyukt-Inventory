import React, { useState, useEffect } from 'react';
import { auditService } from '@/services/auditService';
import { AuditSession, AuditItem } from '@/types';
import { ArrowLeft, CheckCircle, Save, AlertTriangle, Loader2 } from 'lucide-react';

interface PhysicalVerificationViewProps {
  sessionId: string;
  onBack: () => void;
}

const PhysicalVerificationView: React.FC<PhysicalVerificationViewProps> = ({ sessionId, onBack }) => {
  const [session, setSession] = useState<AuditSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [savedItemIds, setSavedItemIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (sessionId) {
      loadSession();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const loadSession = async () => {
    setLoading(true);
    const data = await auditService.getAuditSessionById(sessionId);
    setSession(data);
    if(data) {
        const initCounts: Record<string, number> = {};
        data.items.forEach(i => {
            if (i.physicalQty !== undefined) initCounts[i.itemId] = i.physicalQty;
        });
        setCounts(initCounts);
    }
    setLoading(false);
  };

  const handleCountChange = (itemId: string, val: number) => {
      setCounts(prev => ({ ...prev, [itemId]: val }));
      setSavedItemIds(prev => ({ ...prev, [itemId]: false }));
  };

  const handleSaveItem = async (itemId: string) => {
      const qty = counts[itemId];
      if (qty === undefined || qty < 0) return;
      try {
          setSavingItemId(itemId);
          const updatedSession = await auditService.updateAuditCount(sessionId, itemId, qty);
          setSession(updatedSession);
          const nextCounts: Record<string, number> = {};
          updatedSession.items.forEach(i => {
              if (i.physicalQty !== undefined) nextCounts[i.itemId] = i.physicalQty;
          });
          setCounts(nextCounts);
          setSavedItemIds(prev => ({ ...prev, [itemId]: true }));
      } catch (error) {
          alert("Could not save physical count. Please try again.");
      } finally {
          setSavingItemId(null);
      }
  };

  const handleFinalize = async () => {
      if(!confirm("Finalize Audit? This will permanently adjust stock levels for any variances.")) return;
      setFinishing(true);
      await auditService.finalizeAudit(sessionId);
      setFinishing(false);
      onBack();
  };

  if (loading) return <div className="text-center py-8"><Loader2 className="animate-spin inline mr-2"/> Loading Session...</div>;
  if (!session) return (
    <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
      <AlertTriangle className="mx-auto text-amber-500 mb-4" size={48}/>
      <h3 className="text-xl font-bold text-slate-800">No Session Selected</h3>
      <p className="text-slate-500 mt-2">Please select an active audit session from the Stock Audit or Cycle Count dashboard to begin physical verification.</p>
    </div>
  );

  const isCompleted = session.status === 'Completed';

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <button onClick={onBack} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm font-medium">
                <ArrowLeft size={16}/> Back to List
            </button>
            <div className="text-right">
                <h2 className="text-xl font-bold text-slate-800">{session.reference}</h2>
                <p className="text-xs text-slate-500">{session.warehouseName} • {session.type} Audit</p>
            </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Physical Count Entry</h3>
                {!isCompleted && (
                    <button 
                        onClick={handleFinalize}
                        disabled={finishing}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2"
                    >
                        {finishing ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16}/>}
                        Finalize & Adjust Stock
                    </button>
                )}
                {isCompleted && <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">Audit Closed</span>}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Item Details</th>
                            <th className="px-6 py-4">Warehouse / Bin</th>
                            <th className="px-6 py-4 text-center">System Qty</th>
                            <th className="px-6 py-4 text-center">Physical Qty</th>
                            <th className="px-6 py-4 text-right">Variance</th>
                            <th className="px-6 py-4 text-right">Variance Value</th>
                            {!isCompleted && <th className="px-6 py-4 text-right">Action</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {session.items.map(item => {
                            const variance = (counts[item.itemId] !== undefined ? counts[item.itemId] : (item.physicalQty || 0)) - item.systemQty;
                            const hasVariance = variance !== 0;
                            const varianceValue = variance * Number(item.unitCost || 0);
                            
                            return (
                                <tr key={item.itemId} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-800">{item.itemName}</p>
                                        <p className="text-xs text-slate-500">{item.sku}</p>
                                        <p className="text-xs text-slate-400">
                                            {item.itemType === 'raw-material' ? 'Raw Material' : 'Product'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-700">{item.warehouseName || session.warehouseName}</p>
                                        <p className="text-xs text-slate-500">{item.bin || 'Unassigned'}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center font-medium">{item.systemQty}</td>
                                    <td className="px-6 py-4 text-center">
                                        {isCompleted ? (
                                            <span className="font-bold">{item.physicalQty}</span>
                                        ) : (
                                            <input 
                                                type="number" 
                                                className="w-20 border border-slate-300 rounded p-1 text-center font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                value={counts[item.itemId] ?? ''}
                                                onChange={e => handleCountChange(item.itemId, Number(e.target.value))}
                                            />
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`font-bold ${variance === 0 ? 'text-slate-400' : variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {variance > 0 ? '+' : ''}{variance}
                                        </span>
                                        {hasVariance && <AlertTriangle size={12} className="inline ml-1 text-amber-500"/>}
                                    </td>
                                    <td className="px-6 py-4 text-right font-semibold text-slate-700">
                                        ₹{Math.abs(varianceValue).toLocaleString()}
                                    </td>
                                    {!isCompleted && (
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleSaveItem(item.itemId)}
                                                disabled={savingItemId === item.itemId || counts[item.itemId] === undefined || counts[item.itemId] < 0}
                                                className="inline-flex items-center justify-center text-blue-600 hover:bg-blue-50 p-1.5 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Save physical count to backend"
                                            >
                                                {savingItemId === item.itemId ? (
                                                    <Loader2 size={16} className="animate-spin"/>
                                                ) : savedItemIds[item.itemId] || item.status === 'Counted' ? (
                                                    <CheckCircle size={16} className="text-green-600"/>
                                                ) : (
                                                    <Save size={16}/>
                                                )}
                                            </button>
                                        </td>
                                    )}
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

export default PhysicalVerificationView;
