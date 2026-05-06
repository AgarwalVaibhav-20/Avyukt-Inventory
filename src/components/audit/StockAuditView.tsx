import React, { useState, useEffect } from 'react';
import { auditService } from '@/services/auditService';
import { warehouseService } from '@/services/warehouseService';
import { AuditSession, Warehouse } from '@/types';
import { ClipboardCheck, Play, CheckCircle, Loader2, Plus } from 'lucide-react';
import PhysicalVerificationView from './PhysicalVerificationView';

const StockAuditView: React.FC = () => {
  const [audits, setAudits] = useState<AuditSession[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newAuditWh, setNewAuditWh] = useState('');
  
  // Active verification session
  const [verificationSessionId, setVerificationSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [aData, wData] = await Promise.all([
        auditService.getAuditSessions(),
        warehouseService.getAllWarehouses()
    ]);
    setAudits(aData.filter(a => a.type === 'Full'));
    setWarehouses(wData);
    setLoading(false);
  };

  const handleCreate = async () => {
      if(!newAuditWh) return alert("Select Warehouse");
      await auditService.createAuditSession('Full', newAuditWh);
      setIsCreating(false);
      setNewAuditWh('');
      loadData();
  };

  const handleStart = async (id: string) => {
      await auditService.startAudit(id);
      loadData();
      setVerificationSessionId(id); // Auto open verification
  };

  if(verificationSessionId) {
      return <PhysicalVerificationView sessionId={verificationSessionId} onBack={() => { setVerificationSessionId(null); loadData(); }} />;
  }

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <ClipboardCheck className="text-blue-600" size={20}/> Stock Audit (Full Wall-to-Wall)
                </h2>
                <button onClick={() => setIsCreating(!isCreating)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex gap-2">
                    <Plus size={16}/> Plan New Audit
                </button>
            </div>

            {isCreating && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6 animate-fade-in flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-blue-800 mb-1">Target Warehouse</label>
                        <select className="w-full border rounded p-2 text-sm" value={newAuditWh} onChange={e => setNewAuditWh(e.target.value)}>
                            <option value="">Select Warehouse</option>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                    <button onClick={handleCreate} className="bg-blue-600 text-white px-6 py-2 rounded text-sm hover:bg-blue-700 h-10">Initialize Audit</button>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Reference</th>
                            <th className="px-6 py-4">Warehouse</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Progress</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> : 
                         audits.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-slate-500">No audits recorded.</td></tr> :
                         audits.map(a => (
                            <tr key={a.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-bold text-slate-800">{a.reference}</td>
                                <td className="px-6 py-4">{a.warehouseName}</td>
                                <td className="px-6 py-4 text-slate-500">{a.startDate}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${a.status === 'Completed' ? 'bg-green-100 text-green-700' : a.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {a.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="w-24 bg-slate-200 rounded-full h-1.5">
                                        <div className="bg-blue-600 h-1.5 rounded-full" style={{width: `${a.progress}%`}}></div>
                                    </div>
                                    <span className="text-xs text-slate-500 mt-1 block">{a.progress}%</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {a.status === 'Planned' && (
                                        <button onClick={() => handleStart(a.id)} className="text-blue-600 hover:underline text-xs flex items-center justify-end gap-1 ml-auto">
                                            <Play size={12}/> Start
                                        </button>
                                    )}
                                    {a.status === 'In Progress' && (
                                        <button onClick={() => setVerificationSessionId(a.id)} className="text-orange-600 hover:underline text-xs font-medium">
                                            Continue Count
                                        </button>
                                    )}
                                    {a.status === 'Completed' && (
                                        <button onClick={() => setVerificationSessionId(a.id)} className="text-green-600 hover:underline text-xs flex items-center justify-end gap-1 ml-auto">
                                            <CheckCircle size={12}/> View Report
                                        </button>
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

export default StockAuditView;
