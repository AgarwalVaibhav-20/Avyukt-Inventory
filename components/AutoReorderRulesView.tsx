import React, { useState, useEffect } from 'react';
import { settingsService } from '../services/settingsService';
import { productService } from '../services/productService';
import { AutoReorderRule, InventoryItem } from '../types';
import { RefreshCcw, Plus, Trash2, Save, Loader2 } from 'lucide-react';

const AutoReorderRulesView: React.FC = () => {
  const [rules, setRules] = useState<AutoReorderRule[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newRule, setNewRule] = useState<Partial<AutoReorderRule>>({ active: true });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [rData, iData] = await Promise.all([
        settingsService.getReorderRules(),
        productService.getAllItems()
    ]);
    setRules(rData);
    setItems(iData);
    setLoading(false);
  };

  const handleSave = async () => {
      if(!newRule.itemId || !newRule.minStock || !newRule.reorderQuantity) return alert("Fill required fields");
      const item = items.find(i => i.id === newRule.itemId);
      
      await settingsService.saveReorderRule({
          name: newRule.name || `Rule for ${item?.sku}`,
          itemId: newRule.itemId,
          itemName: item?.name || 'Unknown',
          minStock: Number(newRule.minStock),
          reorderQuantity: Number(newRule.reorderQuantity),
          vendorId: newRule.vendorId,
          active: newRule.active || false
      });
      setIsAdding(false);
      setNewRule({ active: true });
      loadData();
  };

  const handleDelete = async (id: string) => {
      if(confirm('Delete this rule?')) {
          await settingsService.deleteReorderRule(id);
          loadData();
      }
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <RefreshCcw className="text-green-600" size={20}/> Auto Reorder Rules
                </h2>
                <button onClick={() => setIsAdding(!isAdding)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium flex gap-2">
                    <Plus size={16}/> New Rule
                </button>
            </div>

            {isAdding && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6 animate-fade-in grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-green-800 mb-1">Item</label>
                        <select className="w-full border rounded p-2 text-sm" value={newRule.itemId} onChange={e => setNewRule({...newRule, itemId: e.target.value})}>
                            <option value="">Select Item</option>
                            {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-green-800 mb-1">Min Stock</label>
                        <input type="number" className="w-full border rounded p-2 text-sm" value={newRule.minStock || ''} onChange={e => setNewRule({...newRule, minStock: Number(e.target.value)})}/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-green-800 mb-1">Reorder Qty</label>
                        <input type="number" className="w-full border rounded p-2 text-sm" value={newRule.reorderQuantity || ''} onChange={e => setNewRule({...newRule, reorderQuantity: Number(e.target.value)})}/>
                    </div>
                    <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 h-10">Save</button>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Rule Name</th>
                            <th className="px-6 py-4">Item</th>
                            <th className="px-6 py-4 text-center">Min Stock</th>
                            <th className="px-6 py-4 text-center">Order Qty</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> :
                         rules.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-slate-500">No rules defined.</td></tr> :
                         rules.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-800">{r.name}</td>
                                <td className="px-6 py-4">{r.itemName}</td>
                                <td className="px-6 py-4 text-center font-bold text-red-600">{r.minStock}</td>
                                <td className="px-6 py-4 text-center font-bold text-green-600">{r.reorderQuantity}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded text-xs ${r.active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                                        {r.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleDelete(r.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
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

export default AutoReorderRulesView;
