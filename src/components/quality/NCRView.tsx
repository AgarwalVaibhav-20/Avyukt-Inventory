import React, { useState, useEffect } from 'react';
import { qualityService } from '@/services/qualityService';
import { productService } from '@/services/productService';
import { NCR, InventoryItem } from '@/types';
import { AlertTriangle, Plus, Loader2, Search } from 'lucide-react';

const NCRView: React.FC = () => {
  const [ncrs, setNCRs] = useState<NCR[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [form, setForm] = useState({ itemId: '', quantity: 1, refType: 'GRN' as const, refId: '', description: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [nData, iData] = await Promise.all([
        qualityService.getNCRs(),
        productService.getAllItems()
    ]);
    setNCRs(nData);
    setItems(iData);
    setLoading(false);
  };

  const handleCreate = async () => {
      if(!form.itemId || !form.description) return alert("Fill fields");
      const item = items.find(i => i.id === form.itemId);
      await qualityService.createNCR({
          ...form,
          itemName: item?.name || 'Unknown'
      });
      setIsAdding(false);
      setForm({ itemId: '', quantity: 1, refType: 'GRN', refId: '', description: '' });
      loadData();
  };

  const filteredNCRs = ncrs.filter((ncr) => {
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
          !term ||
          ncr.ncrNumber.toLowerCase().includes(term) ||
          ncr.itemName.toLowerCase().includes(term) ||
          ncr.refId.toLowerCase().includes(term) ||
          ncr.description.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'All' || ncr.status === statusFilter;
      const matchesSource = sourceFilter === 'All' || ncr.refType === sourceFilter;
      return matchesSearch && matchesStatus && matchesSource;
  });

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <AlertTriangle className="text-red-600" size={20}/> Non-Conformance Reports (NCR)
                </h2>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search NCR, item, ref..." className="w-full rounded-lg border py-2 pl-9 pr-4 text-sm md:w-64" />
                    </div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
                        <option value="All">All Statuses</option>
                        {[...new Set(ncrs.map((ncr) => ncr.status).filter(Boolean))].map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
                        <option value="All">All Sources</option>
                        {[...new Set(ncrs.map((ncr) => ncr.refType).filter(Boolean))].map((source) => <option key={source} value={source}>{source}</option>)}
                    </select>
                    <button type="button" onClick={() => setIsAdding(!isAdding)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium flex gap-2">
                        <Plus size={16}/> Raise NCR
                    </button>
                </div>
            </div>

            {isAdding && (
                <div className="bg-red-50 p-6 rounded-xl border border-red-100 mb-6 animate-fade-in">
                    <h3 className="font-bold text-red-900 mb-4">New Non-Conformance Report</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-bold text-red-800 mb-1">Source Type</label>
                            <select className="w-full border rounded p-2 text-sm" value={form.refType} onChange={e => setForm({...form, refType: e.target.value as any})}>
                                <option value="GRN">GRN (Supplier Defect)</option>
                                <option value="Production">Production Line</option>
                                <option value="Customer Return">Customer Return</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-red-800 mb-1">Reference ID</label>
                            <input type="text" className="w-full border rounded p-2 text-sm" placeholder="e.g. GRN-2023-001" value={form.refId} onChange={e => setForm({...form, refId: e.target.value})}/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-red-800 mb-1">Item</label>
                            <select className="w-full border rounded p-2 text-sm" value={form.itemId} onChange={e => setForm({...form, itemId: e.target.value})}>
                                <option value="">Select Item</option>
                                {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-red-800 mb-1">Quantity Affected</label>
                            <input type="number" className="w-full border rounded p-2 text-sm" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})}/>
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-red-800 mb-1">Description of Non-Conformance</label>
                        <textarea className="w-full border rounded p-2 text-sm" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})}></textarea>
                    </div>
                    <div className="flex justify-end">
                        <button type="button" onClick={handleCreate} className="bg-red-600 text-white px-6 py-2 rounded text-sm hover:bg-red-700">Submit Report</button>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {loading ? <div className="text-center py-4"><Loader2 className="animate-spin-slow inline"/></div> :
                 filteredNCRs.length === 0 ? <p className="text-center text-slate-500 py-4">No open NCRs.</p> :
                 filteredNCRs.map(ncr => (
                    <div key={ncr.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 hover:bg-white transition-colors">
                        <div className="flex justify-between mb-2">
                            <span className="font-bold text-slate-800">{ncr.ncrNumber}</span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${ncr.status === 'Open' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'}`}>{ncr.status}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 mb-2">
                            <p><span className="font-medium">Item:</span> {ncr.itemName}</p>
                            <p><span className="font-medium">Source:</span> {ncr.refType} #{ncr.refId}</p>
                        </div>
                        <p className="text-sm text-slate-700 bg-white p-2 rounded border border-slate-200">{ncr.description}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default NCRView;
