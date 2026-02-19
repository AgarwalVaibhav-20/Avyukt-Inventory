import React, { useState, useEffect } from 'react';
import { stockControlService } from '../services/stockControlService';
import { productService } from '../services/productService';
import { Batch, InventoryItem } from '../types';
import { Package, Calendar, Search, Plus, Loader2 } from 'lucide-react';

const BatchTrackingView: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
      itemId: '',
      batchNumber: '',
      quantity: 0,
      mfgDate: '',
      expiryDate: '',
      costPrice: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [bData, iData] = await Promise.all([
        stockControlService.getBatches(),
        productService.getAllItems()
    ]);
    setBatches(bData);
    setItems(iData);
    setLoading(false);
  };

  const handleCreate = async () => {
      if(!formData.itemId || !formData.batchNumber) return alert("Fill all fields");
      const item = items.find(i => i.id === formData.itemId);
      await stockControlService.createBatch({
          ...formData,
          itemName: item?.name || 'Unknown'
      });
      setIsAdding(false);
      setFormData({ itemId: '', batchNumber: '', quantity: 0, mfgDate: '', expiryDate: '', costPrice: 0 });
      loadData();
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Package className="text-purple-600" size={20}/> Batch / Lot Tracking
                </h2>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium"
                >
                    <Plus size={16}/> New Batch
                </button>
            </div>

            {isAdding && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 animate-fade-in">
                    <h3 className="font-semibold text-slate-700 mb-3">Register New Batch</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Item</label>
                            <select 
                                className="w-full border rounded p-2 text-sm"
                                value={formData.itemId}
                                onChange={e => setFormData({...formData, itemId: e.target.value})}
                            >
                                <option value="">Select Item</option>
                                {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Batch #</label>
                            <input type="text" className="w-full border rounded p-2 text-sm" value={formData.batchNumber} onChange={e => setFormData({...formData, batchNumber: e.target.value})}/>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Quantity</label>
                            <input type="number" className="w-full border rounded p-2 text-sm" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}/>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Mfg Date</label>
                            <input type="date" className="w-full border rounded p-2 text-sm" value={formData.mfgDate} onChange={e => setFormData({...formData, mfgDate: e.target.value})}/>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Expiry Date</label>
                            <input type="date" className="w-full border rounded p-2 text-sm" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})}/>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Cost Price</label>
                            <input type="number" className="w-full border rounded p-2 text-sm" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})}/>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleCreate} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">Save Batch</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? <div className="col-span-3 text-center py-8"><Loader2 className="animate-spin inline"/></div> : 
                 batches.length === 0 ? <div className="col-span-3 text-center text-slate-500 py-8">No active batches.</div> :
                 batches.map(b => (
                    <div key={b.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded text-xs">{b.batchNumber}</span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${b.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{b.status}</span>
                        </div>
                        <h3 className="font-medium text-slate-800 mb-1">{b.itemName}</h3>
                        <div className="text-xs text-slate-500 space-y-1">
                            <p className="flex justify-between"><span>Qty:</span> <span className="font-bold text-slate-700">{b.quantity}</span></p>
                            <p className="flex justify-between"><span>Cost:</span> <span>${b.costPrice.toFixed(2)}</span></p>
                            <div className="border-t border-slate-100 my-2 pt-1">
                                <p className="flex items-center gap-1"><Calendar size={12}/> Mfg: {b.mfgDate}</p>
                                <p className="flex items-center gap-1 text-red-500"><Calendar size={12}/> Exp: {b.expiryDate}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default BatchTrackingView;
