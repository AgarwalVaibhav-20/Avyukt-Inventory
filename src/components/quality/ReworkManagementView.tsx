import React, { useState, useEffect } from 'react';
import { qualityService } from '@/services/qualityService';
import { productService } from '@/services/productService';
import { ReworkEntry, InventoryItem } from '@/types';
import { Wrench, ArrowRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const ReworkManagementView: React.FC = () => {
  const [reworkList, setReworkList] = useState<ReworkEntry[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newRework, setNewRework] = useState({ itemId: '', quantity: 1, reason: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [rData, iData] = await Promise.all([
        qualityService.getReworkEntries(),
        productService.getAllItems()
    ]);
    setReworkList(rData);
    setItems(iData);
    setLoading(false);
  };

  const handleCreate = async () => {
      if(!newRework.itemId || !newRework.reason) return;
      const item = items.find(i => i.id === newRework.itemId);
      await qualityService.createReworkEntry({
          ...newRework,
          itemName: item?.name || 'Unknown'
      });
      setIsAdding(false);
      setNewRework({ itemId: '', quantity: 1, reason: '' });
      loadData();
  };

  const handleStatusUpdate = async (id: string, status: ReworkEntry['status'], outcome?: ReworkEntry['outcome']) => {
      await qualityService.updateReworkStatus(id, status, outcome);
      loadData();
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Wrench className="text-orange-600" size={20}/> Rework Management
            </h2>
            <button type="button" onClick={() => setIsAdding(!isAdding)} className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm font-medium">
                + New Job
            </button>
        </div>

        {isAdding && (
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 animate-fade-in flex gap-4 items-end">
                <div className="flex-1">
                    <label className="text-xs font-bold text-orange-800">Item</label>
                    <select className="w-full border rounded p-2 text-sm" value={newRework.itemId} onChange={e => setNewRework({...newRework, itemId: e.target.value})}>
                        <option value="">Select Item</option>
                        {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                </div>
                <div className="w-24">
                    <label className="text-xs font-bold text-orange-800">Qty</label>
                    <input type="number" className="w-full border rounded p-2 text-sm" value={newRework.quantity} onChange={e => setNewRework({...newRework, quantity: Number(e.target.value)})}/>
                </div>
                <div className="flex-1">
                    <label className="text-xs font-bold text-orange-800">Defect Reason</label>
                    <input type="text" className="w-full border rounded p-2 text-sm" value={newRework.reason} onChange={e => setNewRework({...newRework, reason: e.target.value})}/>
                </div>
                <button type="button" onClick={handleCreate} className="bg-orange-600 text-white px-6 py-2 rounded text-sm hover:bg-orange-700 h-10">Start Job</button>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Columns for Kanban-like view */}
            {['Pending', 'In Progress', 'Completed'].map(status => (
                <div key={status} className="bg-slate-100 rounded-xl p-4 min-h-[400px]">
                    <h3 className="font-bold text-slate-700 mb-4 flex justify-between">
                        {status} 
                        <span className="bg-white px-2 rounded-full text-xs py-0.5 border">{reworkList.filter(r => status === 'Completed' ? (r.status === 'Completed' || r.status === 'Scrapped') : r.status === status).length}</span>
                    </h3>
                    <div className="space-y-3">
                        {reworkList.filter(r => status === 'Completed' ? (r.status === 'Completed' || r.status === 'Scrapped') : r.status === status).map(job => {
                            const resolvedItemName = job.itemName && job.itemName !== 'Unknown Item' && job.itemName !== 'Unknown' 
                                ? job.itemName 
                                : (items.find(i => i.id === job.itemId)?.name || job.itemName || 'Unknown Item');

                            return (
                                <div key={job.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow transition">
                                    <div className="flex justify-between mb-1 items-center">
                                        <span className="font-bold text-sm text-slate-800 truncate w-2/3">{resolvedItemName}</span>
                                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{job.quantity} units</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{job.reason}</p>
                                    
                                    {job.status === 'Pending' && (
                                        <button type="button" onClick={() => handleStatusUpdate(job.id, 'In Progress')} className="w-full bg-blue-50 text-blue-600 text-xs font-bold py-1.5 rounded-lg hover:bg-blue-100 transition shadow-sm">Start Work</button>
                                    )}
                                    
                                    {job.status === 'In Progress' && (
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => handleStatusUpdate(job.id, 'Completed', 'Restocked')} className="flex-1 bg-green-50 text-green-700 text-xs font-bold py-1.5 rounded-lg hover:bg-green-100 transition shadow-sm">Restock</button>
                                            <button type="button" onClick={() => handleStatusUpdate(job.id, 'Scrapped', 'Scrapped')} className="flex-1 bg-red-50 text-red-700 text-xs font-bold py-1.5 rounded-lg hover:bg-red-100 transition shadow-sm">Scrap</button>
                                        </div>
                                    )}

                                    {(job.status === 'Completed' || job.status === 'Scrapped') && (
                                        <div className={`text-xs text-center py-1 rounded-lg font-bold ${job.outcome === 'Restocked' ? 'text-green-700 bg-green-50 border border-green-200' : 'text-red-700 bg-red-50 border border-red-200'}`}>
                                            {job.outcome} on {job.completionDate ? new Date(job.completionDate).toLocaleDateString() : ''}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default ReworkManagementView;
