import React, { useState, useEffect } from 'react';
import { Warehouse, StockTransfer as StockTransferType } from '@/types';
import { ArrowRightLeft, Calendar, MapPin, Truck, CheckCircle2, Loader2, Package, Plus, Trash2, AlertCircle, Search } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createWarehouseTransfer, fetchStockMovementData } from '@/store/slices/stockMovementSlice';
import api from '@/services/api';

interface TransferItemEntry {
    itemId: string;
    itemName: string;
    quantity: number;
    availableQty: number;
    itemType: string;
}

const StockTransfer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { warehouses, transfers, loading, actionLoading, error } = useAppSelector((state) => state.stockMovement);

  // Form State
  const [sourceId, setSourceId] = useState('');
  const [destId, setDestId] = useState('');
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  
  // Current Item Selection
  const [selectedItemId, setSelectedItemId] = useState('');
  const [qty, setQty] = useState<number>(0);
  
  // Transfer List
  const [transferItems, setTransferItems] = useState<TransferItemEntry[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('All');

  useEffect(() => {
    dispatch(fetchStockMovementData());
  }, [dispatch]);

  useEffect(() => {
    if (sourceId) {
        loadAvailableItems(sourceId);
    } else {
        setAvailableItems([]);
    }
    setTransferItems([]);
    setSelectedItemId('');
    setQty(0);
  }, [sourceId]);

  const loadAvailableItems = async (whId: string) => {
    setLoadingItems(true);
    try {
        const response = await api.get(`/api/transfer/materials/${whId}`);
        setAvailableItems(response.data.materials || []);
    } catch (e) {
        console.error("Failed to load available items", e);
    } finally {
        setLoadingItems(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedItemId || qty <= 0) return;
    
    const item = availableItems.find(i => i._id === selectedItemId);
    if (!item) return;

    if (qty > item.availableQty) {
        alert(`Insufficient stock. Available: ${item.availableQty}`);
        return;
    }

    const existingIdx = transferItems.findIndex(i => i.itemId === selectedItemId);
    if (existingIdx > -1) {
        const newList = [...transferItems];
        newList[existingIdx].quantity += qty;
        setTransferItems(newList);
    } else {
        setTransferItems([...transferItems, {
            itemId: item._id,
            itemName: item.name,
            quantity: qty,
            availableQty: item.availableQty,
            itemType: item.itemType
        }]);
    }
    
    setSelectedItemId('');
    setQty(0);
  };

  const handleRemoveItem = (id: string) => {
    setTransferItems(transferItems.filter(i => i.itemId !== id));
  };

  const handleTransfer = async () => {
    if (!sourceId || !destId || transferItems.length === 0) {
      alert("Please fill all fields and add at least one item.");
      return;
    }
    if (sourceId === destId) {
      alert("Source and Destination cannot be the same.");
      return;
    }

    try {
      await dispatch(createWarehouseTransfer({
        sourceWarehouseId: sourceId,
        destinationWarehouseId: destId,
        items: transferItems.map(i => ({
            itemId: i.itemId,
            itemType: i.itemType,
            quantity: i.quantity
        }))
      })).unwrap();
      
      // Reset form
      setSourceId('');
      setDestId('');
      setTransferItems([]);
      alert("Transfer Initiated Successfully!");
    } catch (e) {
      console.error(e);
    }
  };

  const getWarehouseName = (id: string) => warehouses.find(w => w.id === id)?.name || id;

  const typedWarehouses = warehouses as Warehouse[];
  const typedTransfers = transfers as StockTransferType[];
  const filteredTransfers = typedTransfers.filter((trf) => {
    const term = historySearch.trim().toLowerCase();
    const sourceName = getWarehouseName(trf.sourceWarehouseId);
    const destinationName = getWarehouseName(trf.destinationWarehouseId);
    const matchesSearch =
      !term ||
      trf.referenceNo.toLowerCase().includes(term) ||
      sourceName.toLowerCase().includes(term) ||
      destinationName.toLowerCase().includes(term) ||
      trf.items.some((item) => item.itemName.toLowerCase().includes(term));
    const matchesStatus = historyStatusFilter === 'All' || trf.status === historyStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
       {/* Transfer Form Card */}
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Truck className="text-blue-600" size={20} /> Inter-Warehouse Stock Transfer
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Source Warehouse</label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <select 
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                        value={sourceId}
                        onChange={(e) => setSourceId(e.target.value)}
                    >
                        <option value="">Select Source</option>
                        {typedWarehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Destination Warehouse</label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <select 
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                        value={destId}
                        onChange={(e) => setDestId(e.target.value)}
                    >
                        <option value="">Select Destination</option>
                        {typedWarehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>
            </div>
          </div>

          {/* Add Item Section */}
          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Package size={16} className="text-slate-400"/> Add Items to Transfer
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-white p-4 rounded-xl border border-slate-200 mb-6">
                <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Select Item from {getWarehouseName(sourceId)}</label>
                    <select 
                        disabled={!sourceId || loadingItems}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        value={selectedItemId}
                        onChange={(e) => setSelectedItemId(e.target.value)}
                    >
                        <option value="">{loadingItems ? 'Loading items...' : 'Select Item'}</option>
                        {availableItems.map(i => (
                            <option key={i._id} value={i._id}>{i.name} (Stock: {i.availableQty})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Quantity</label>
                    <input 
                        type="number" 
                        min="1"
                        disabled={!selectedItemId}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        value={qty || ''}
                        onChange={(e) => setQty(Number(e.target.value))}
                        placeholder="0"
                    />
                </div>
                <button 
                    onClick={handleAddItem}
                    disabled={!selectedItemId || qty <= 0}
                    className="h-[42px] flex items-center justify-center gap-2 bg-slate-800 text-white px-4 rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50"
                >
                    <Plus size={18}/> Add
                </button>
            </div>

            {/* Transfer Items Table */}
            {transferItems.length > 0 && (
                <div className="mb-6 border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-2 text-left font-semibold text-slate-600">Item Name</th>
                                <th className="px-4 py-2 text-center font-semibold text-slate-600">Quantity</th>
                                <th className="px-4 py-2 text-right font-semibold text-slate-600">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transferItems.map(item => (
                                <tr key={item.itemId}>
                                    <td className="px-4 py-3 text-slate-700">{item.itemName}</td>
                                    <td className="px-4 py-3 text-center font-medium text-slate-900">{item.quantity}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => handleRemoveItem(item.itemId)} className="text-red-500 hover:text-red-700 p-1">
                                            <Trash2 size={16}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <div className="text-sm text-slate-500">
                {transferItems.length} items in list
            </div>
            <button 
                onClick={handleTransfer}
                disabled={actionLoading || loading || transferItems.length === 0}
                className="flex items-center gap-2 bg-blue-600 text-white px-8 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-lg font-bold disabled:opacity-50"
            >
                {actionLoading ? <Loader2 className="animate-spin" size={18}/> : <ArrowRightLeft size={18}/>}
                Initiate Inter-Warehouse Transfer
            </button>
          </div>
       </div>

       {error && (
         <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 flex items-start gap-3">
            <AlertCircle className="text-red-600 shrink-0" size={20}/>
            <div>
                <p className="text-sm font-bold text-red-800">Transfer Error</p>
                <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
         </div>
       )}

       {/* History Table */}
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <h3 className="font-bold text-slate-800">Transfer History</h3>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} placeholder="Search transfer history..." className="w-full rounded-lg border py-2 pl-9 pr-4 text-sm md:w-72" />
              </div>
              <select value={historyStatusFilter} onChange={(e) => setHistoryStatusFilter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
                <option value="All">All Statuses</option>
                {[...new Set(typedTransfers.map((transfer) => transfer.status).filter(Boolean))].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <button onClick={() => dispatch(fetchStockMovementData())} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Refresh</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4">Reference</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Source / Destination</th>
                        <th className="px-6 py-4">Items</th>
                        <th className="px-6 py-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                         <tr><td colSpan={5} className="py-12 text-center text-slate-500"><Loader2 className="animate-spin inline mr-2"/> Loading transfers...</td></tr>
                    ) : filteredTransfers.length === 0 ? (
                         <tr><td colSpan={5} className="py-12 text-center text-slate-500 font-medium">No transfers recorded in the system.</td></tr>
                    ) : (
                        filteredTransfers.map((trf) => (
                            <tr key={trf.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-900">{trf.referenceNo}</td>
                                <td className="px-6 py-4 text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-400"/> {trf.date}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2 text-xs"><span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">FROM</span> <span className="font-medium text-slate-800">{getWarehouseName(trf.sourceWarehouseId)}</span></div>
                                        <div className="flex items-center gap-2 text-xs"><span className="bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-bold">TO</span> <span className="font-medium text-slate-800">{getWarehouseName(trf.destinationWarehouseId)}</span></div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        {trf.items.map((item, idx) => (
                                            <div key={idx} className="text-slate-700 text-xs flex items-center gap-2">
                                                <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-600">{item.quantity}</span> 
                                                <span className="truncate max-w-[150px]">{item.itemName}</span>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`
                                        inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border
                                        ${trf.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-100' : 
                                          trf.status === 'In Transit' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                          'bg-amber-50 text-amber-700 border-amber-100'}
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
