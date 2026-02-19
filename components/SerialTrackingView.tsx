import React, { useState, useEffect } from 'react';
import { stockControlService } from '../services/stockControlService';
import { productService } from '../services/productService';
import { SerialNumber, InventoryItem } from '../types';
import { ScanBarcode, MapPin, Plus, Loader2 } from 'lucide-react';

const SerialTrackingView: React.FC = () => {
  const [serials, setSerials] = useState<SerialNumber[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newSerial, setNewSerial] = useState({ itemId: '', serialNumber: '', currentLocation: 'Warehouse A' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [sData, iData] = await Promise.all([
        stockControlService.getSerials(),
        productService.getAllItems()
    ]);
    setSerials(sData);
    setItems(iData);
    setLoading(false);
  };

  const handleAdd = async () => {
      if(!newSerial.itemId || !newSerial.serialNumber) return;
      const item = items.find(i => i.id === newSerial.itemId);
      await stockControlService.addSerial({
          ...newSerial,
          itemName: item?.name || 'Unknown'
      });
      setIsAdding(false);
      setNewSerial({ itemId: '', serialNumber: '', currentLocation: 'Warehouse A' });
      loadData();
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <ScanBarcode className="text-indigo-600" size={20}/> Serial Number Tracking
                </h2>
                <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium">
                    <Plus size={16}/> Register Serial
                </button>
            </div>

            {isAdding && (
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-6 flex flex-col md:flex-row gap-4 items-end animate-fade-in">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-indigo-800 mb-1">Item</label>
                        <select className="w-full border rounded p-2 text-sm" value={newSerial.itemId} onChange={e => setNewSerial({...newSerial, itemId: e.target.value})}>
                            <option value="">Select Item</option>
                            {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-indigo-800 mb-1">Serial Number</label>
                        <input type="text" className="w-full border rounded p-2 text-sm" placeholder="SN-XXXX" value={newSerial.serialNumber} onChange={e => setNewSerial({...newSerial, serialNumber: e.target.value})}/>
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-medium text-indigo-800 mb-1">Location</label>
                        <input type="text" className="w-full border rounded p-2 text-sm" value={newSerial.currentLocation} onChange={e => setNewSerial({...newSerial, currentLocation: e.target.value})}/>
                    </div>
                    <button onClick={handleAdd} className="bg-indigo-600 text-white px-6 py-2 rounded text-sm hover:bg-indigo-700 h-10">Save</button>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Serial Number</th>
                            <th className="px-6 py-4">Item</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Location</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={4} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> :
                         serials.length === 0 ? <tr><td colSpan={4} className="py-8 text-center text-slate-500">No serials tracked.</td></tr> :
                         serials.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-mono font-medium text-indigo-600">{s.serialNumber}</td>
                                <td className="px-6 py-4">{s.itemName}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        s.status === 'Available' ? 'bg-green-100 text-green-700' : 
                                        s.status === 'Sold' ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {s.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 flex items-center gap-1">
                                    <MapPin size={14}/> {s.currentLocation}
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

export default SerialTrackingView;
