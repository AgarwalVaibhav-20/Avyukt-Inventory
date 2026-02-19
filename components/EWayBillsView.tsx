import React, { useState, useEffect } from 'react';
import { documentService } from '../services/documentService';
import { salesService } from '../services/salesService';
import { EWayBill, DeliveryChallan } from '../types';
import { Truck, Plus, ExternalLink, Loader2 } from 'lucide-react';

const EWayBillsView: React.FC = () => {
  const [bills, setBills] = useState<EWayBill[]>([]);
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  const [form, setForm] = useState({
      challanId: '',
      transporter: '',
      vehicleNo: '',
      distance: 0,
      validUntil: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [bData, cData] = await Promise.all([
        documentService.getEWayBills(),
        salesService.getChallans()
    ]);
    setBills(bData);
    setChallans(cData.filter(c => c.status === 'Generated')); // Only allow active challans
    setLoading(false);
  };

  const handleCreate = async () => {
      if(!form.challanId || !form.transporter) return alert("Fill details");
      const challan = challans.find(c => c.id === form.challanId);
      
      await documentService.createEWayBill({
          challanId: form.challanId,
          challanNumber: challan?.challanNumber || '',
          customerName: challan?.customerName || '',
          transporter: form.transporter,
          vehicleNo: form.vehicleNo,
          distance: form.distance,
          validUntil: form.validUntil,
          status: 'Active'
      });
      setIsCreating(false);
      setForm({ challanId: '', transporter: '', vehicleNo: '', distance: 0, validUntil: '' });
      loadData();
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Truck className="text-purple-600" size={20}/> E-Way Bills
                </h2>
                <button onClick={() => setIsCreating(!isCreating)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium flex gap-2">
                    <Plus size={16}/> New E-Way Bill
                </button>
            </div>

            {isCreating && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mb-6 animate-fade-in">
                    <h3 className="font-bold text-purple-900 mb-3">Generate E-Way Bill</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-purple-800 mb-1">Challan</label>
                            <select className="w-full border rounded p-2 text-sm" value={form.challanId} onChange={e => setForm({...form, challanId: e.target.value})}>
                                <option value="">Select Challan</option>
                                {challans.map(c => <option key={c.id} value={c.id}>{c.challanNumber}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-purple-800 mb-1">Transporter</label>
                            <input type="text" className="w-full border rounded p-2 text-sm" value={form.transporter} onChange={e => setForm({...form, transporter: e.target.value})}/>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-purple-800 mb-1">Vehicle No</label>
                            <input type="text" className="w-full border rounded p-2 text-sm" value={form.vehicleNo} onChange={e => setForm({...form, vehicleNo: e.target.value})}/>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-purple-800 mb-1">Distance (km)</label>
                            <input type="number" className="w-full border rounded p-2 text-sm" value={form.distance} onChange={e => setForm({...form, distance: Number(e.target.value)})}/>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-purple-800 mb-1">Valid Until</label>
                            <input type="date" className="w-full border rounded p-2 text-sm" value={form.validUntil} onChange={e => setForm({...form, validUntil: e.target.value})}/>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleCreate} className="bg-purple-600 text-white px-6 py-2 rounded text-sm hover:bg-purple-700">Generate</button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">EWB No</th>
                            <th className="px-6 py-4">Generated</th>
                            <th className="px-6 py-4">Challan Ref</th>
                            <th className="px-6 py-4">Transporter</th>
                            <th className="px-6 py-4">Valid Until</th>
                            <th className="px-6 py-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> :
                         bills.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-slate-500">No bills generated.</td></tr> :
                         bills.map(b => (
                            <tr key={b.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-bold text-slate-800 font-mono">{b.billNumber}</td>
                                <td className="px-6 py-4 text-slate-500">{b.generatedDate}</td>
                                <td className="px-6 py-4">{b.challanNumber}</td>
                                <td className="px-6 py-4 text-slate-600">{b.transporter} ({b.vehicleNo})</td>
                                <td className="px-6 py-4 text-slate-500">{b.validUntil}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">{b.status}</span>
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

export default EWayBillsView;
