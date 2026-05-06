import React, { useState, useEffect } from 'react';
import { Warehouse, InventoryItem, StockTransfer as StockTransferType } from '@/types';
import { ArrowRightLeft, Calendar, MapPin, Truck, CheckCircle2, Loader2, Package } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createWarehouseTransfer, fetchStockMovementData } from '@/store/slices/stockMovementSlice';

const StockTransfer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { warehouses, items, transfers, loading, actionLoading, error } = useAppSelector((state) => state.stockMovement);

  // Form State
  const [sourceId, setSourceId] = useState('');
  const [destId, setDestId] = useState('');
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState<number>(0);

  useEffect(() => {
    dispatch(fetchStockMovementData());
  }, [dispatch]);

  const handleTransfer = async () => {
    if (!sourceId || !destId || !itemId || qty <= 0) {
      alert("Please fill all fields correctly.");
      return;
    }
    if (sourceId === destId) {
      alert("Source and Destination cannot be the same.");
      return;
    }

    const selectedItem = items.find(i => i.id === itemId);
    
    try {
      await dispatch(createWarehouseTransfer({
        sourceWarehouseId: sourceId,
        destinationWarehouseId: destId,
        items: [{
          itemId,
          itemName: selectedItem?.name || 'Unknown Item',
          quantity: qty
        }]
      })).unwrap();
      
      // Reset form
      setQty(0);
      setItemId('');
      alert("Transfer Initiated Successfully!");
    } catch (e) {
      console.error(e);
      alert("Transfer failed.");
    }
  };

  const getWarehouseName = (id: string) => warehouses.find(w => w.id === id)?.name || id;

  const typedWarehouses = warehouses as Warehouse[];
  const typedItems = items as InventoryItem[];
  const typedTransfers = transfers as StockTransferType[];

  return (
    <div className="space-y-6">
       {/* Transfer Form Card */}
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Truck className="text-blue-600" size={20} /> New Stock Transfer
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Source Warehouse</label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <select 
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        value={sourceId}
                        onChange={(e) => setSourceId(e.target.value)}
                    >
                        <option value="">Select Source</option>
                        {typedWarehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Destination Warehouse</label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <select 
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        value={destId}
                        onChange={(e) => setDestId(e.target.value)}
                    >
                        <option value="">Select Destination</option>
                        {typedWarehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
             <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Item to Transfer</label>
                <div className="relative">
                    <Package className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <select 
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        value={itemId}
                        onChange={(e) => setItemId(e.target.value)}
                    >
                        <option value="">Select Item</option>
                        {typedItems.map(i => <option key={i.id} value={i.id}>{i.sku} - {i.name} (Curr: {i.stock})</option>)}
                    </select>
                </div>
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                <input 
                    type="number" 
                    min="1"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={qty || ''}
                    onChange={(e) => setQty(Number(e.target.value))}
                    placeholder="0"
                />
             </div>
          </div>

          <div className="flex justify-end">
            <button 
                onClick={handleTransfer}
                disabled={actionLoading || loading}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium disabled:opacity-50"
            >
                {actionLoading ? <Loader2 className="animate-spin" size={18}/> : <ArrowRightLeft size={18}/>}
                Initiate Transfer
            </button>
          </div>
       </div>

       {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

       {/* History Table */}
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">Transfer History</h3>
            <button onClick={() => dispatch(fetchStockMovementData())} className="text-blue-600 hover:text-blue-800 text-sm">Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-3">Reference</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Source / Destination</th>
                        <th className="px-6 py-3">Items</th>
                        <th className="px-6 py-3">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                         <tr><td colSpan={5} className="py-8 text-center text-slate-500">Loading...</td></tr>
                    ) : typedTransfers.length === 0 ? (
                         <tr><td colSpan={5} className="py-8 text-center text-slate-500">No transfers recorded.</td></tr>
                    ) : (
                        typedTransfers.map((trf) => (
                            <tr key={trf.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">{trf.referenceNo}</td>
                                <td className="px-6 py-4 text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14}/> {trf.date}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1 text-xs"><span className="w-12 text-slate-400">From:</span> <span className="font-medium">{getWarehouseName(trf.sourceWarehouseId)}</span></div>
                                        <div className="flex items-center gap-1 text-xs"><span className="w-12 text-slate-400">To:</span> <span className="font-medium">{getWarehouseName(trf.destinationWarehouseId)}</span></div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {trf.items.map((item, idx) => (
                                        <div key={idx} className="text-slate-700">
                                            <span className="font-medium">{item.quantity} x</span> {item.itemName}
                                        </div>
                                    ))}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`
                                        inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border
                                        ${trf.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'}
                                    `}>
                                        {trf.status === 'Completed' ? <CheckCircle2 size={12}/> : <Truck size={12}/>}
                                        {trf.status}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
          </div>
       </div>
    </div>
  );
};

export default StockTransfer;
