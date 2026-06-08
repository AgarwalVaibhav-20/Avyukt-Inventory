import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchPOs, fetchVendors, fetchPRs } from '@/store/slices/procurementSlice';
import { procurementService } from '@/services/procurementService';
import { productService } from '@/services/productService';
import { PurchaseOrder, Vendor, InventoryItem, POItem, PurchaseRequisition, VendorItemMap } from '@/types';
import { Plus, FileText, Calendar, User, Loader2, Check, AlertCircle, ShoppingCart, Tag, Package, Hash, ClipboardList, Search, Filter, IndianRupee } from 'lucide-react';
import Pagination from '@/components/common/Pagination';
import { useListControls } from '@/hooks/useListControls';
import { vendorService } from '@/services/vendorService';

const PurchaseOrderView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { pos, vendors, prs, loading, error } = useAppSelector((state) => state.procurement);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [priceMaps, setPriceMaps] = useState<VendorItemMap[]>([]);
  const [localLoading, setLocalLoading] = useState(false);
  
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPRId, setSelectedPRId] = useState<string>('');
  const defaultDeliveryDate = () => new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const [newPO, setNewPO] = useState<{vendorId: string, date: string, deliveryDate: string, items: POItem[]}>({
    vendorId: '',
    date: new Date().toISOString().split('T')[0],
    deliveryDate: defaultDeliveryDate(),
    items: []
  });

  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [updatingVendorId, setUpdatingVendorId] = useState('');
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ status: 'all', sortOrder: 'newest' });

  useEffect(() => {
    dispatch(fetchPOs());
    dispatch(fetchVendors());
    dispatch(fetchPRs());
    loadItems();
    loadPriceMaps();
  }, [dispatch]);

  const loadPriceMaps = async () => {
    try {
      const maps = await vendorService.getVendorItemMaps();
      setPriceMaps(maps);
    } catch (e) {
      console.error("Failed to load price maps", e);
    }
  };

  const loadItems = async () => {
    try {
      const data = await productService.getAllItems();
      setItems(data);
    } catch (e) {
      console.error("Failed to load items", e);
    }
  };

  const handleAddItem = () => {
    setNewPO({
        ...newPO,
        items: [...newPO.items, { itemId: '', itemName: '', hsnCode: '', quantity: 1, unitPrice: 0, receivedQty: 0, taxRate: 0 }]
    });
  };

  const handlePRSelect = (prId: string) => {
    setSelectedPRId(prId);
    if (!prId) return;

    const pr = prs.find(p => p.id === prId);
    if (!pr) return;

    // Map PR items to PO items
    const poItems: POItem[] = pr.items.map(item => {
        const product = items.find(i => i.id === item.itemId);
        const vendorPrice = priceMaps.find(m => m.vendorId === newPO.vendorId && m.itemId === item.itemId);
        return {
            itemId: item.itemId,
            itemName: item.itemName,
            hsnCode: item.hsnCode || product?.hsnCode || '',
            quantity: item.quantity,
            unitPrice: vendorPrice?.price || 0,
            receivedQty: 0,
            taxRate: item.taxRate || product?.taxRate || 0
        };
    });

    setNewPO({
        ...newPO,
        items: poItems
    });
  };

  const updateItem = (index: number, field: keyof POItem, value: any) => {
    const updatedItems = [...newPO.items];
    if (field === 'itemId') {
        const selectedItem = items.find(i => i.id === value);
        const vendorPrice = priceMaps.find(m => 
            m.vendorId === newPO.vendorId && 
            (m.itemId === value || (m.itemName === selectedItem?.name))
        );
        updatedItems[index] = {
            ...updatedItems[index],
            itemId: value,
            itemName: selectedItem?.name || '',
            hsnCode: selectedItem?.hsnCode || '',
            unitPrice: vendorPrice?.price || 0,
            taxRate: selectedItem?.taxRate || 0
        };
    } else {
        // @ts-ignore
        updatedItems[index][field] = value;
    }
    setNewPO({ ...newPO, items: updatedItems });
  };

  const handleCreate = async () => {
    if (!newPO.vendorId || newPO.items.length === 0) return alert("Please select vendor and items");
    if (newPO.items.some(item => !item.itemId || !item.itemName)) return alert("Please select an item for every PO line");
    if (newPO.items.some(item => item.quantity <= 0 || item.unitPrice < 0)) return alert("Please enter valid quantity and unit cost for every PO line");
    const vendor = vendors.find(v => v.id === newPO.vendorId);
    
    setLocalLoading(true);
    try {
      // Calc total including tax
      const totalAmount = newPO.items.reduce((sum, item) => {
        const base = item.quantity * item.unitPrice;
        const tax = base * (item.taxRate / 100);
        return sum + base + tax;
      }, 0);

      await procurementService.createPO({
          vendorId: newPO.vendorId,
          vendorName: vendor?.name || '',
          date: newPO.date,
          deliveryDate: newPO.deliveryDate,
          totalAmount,
          items: newPO.items,
          prId: selectedPRId || undefined
      });
      
      setIsCreating(false);
      setNewPO({ vendorId: '', date: new Date().toISOString().split('T')[0], deliveryDate: defaultDeliveryDate(), items: [] });
      setSelectedPRId('');
      dispatch(fetchPOs());
    } catch (e: any) {
      console.error(e);
      const errors = e.response?.data?.errors;
      const detail = errors
        ? Object.entries(errors).map(([field, message]) => `${field}: ${message}`).join('\n')
        : e.response?.data?.message || e.message;
      alert(`Failed to create Purchase Order${detail ? `\n${detail}` : ''}`);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleOpenDetail = (po: PurchaseOrder) => {
      setSelectedPO(po);
      setUpdatingVendorId(po.vendorId || '');
      setIsDetailModalOpen(true);
  };

  const handleUpdatePO = async () => {
      if (!selectedPO || !updatingVendorId) return alert("Please select a vendor");
      
      const vendor = vendors.find(v => v.id === updatingVendorId);
      setLocalLoading(true);
      try {
          await procurementService.updatePO(selectedPO.id, {
              vendorId: updatingVendorId,
              vendor: vendor?.name || '',
              status: 'Pending', // Use a status allowed by the schema enum
              items: selectedPO.items, // Pass the updated items from local state
              totalAmount: selectedPO.totalAmount
          });
          setIsDetailModalOpen(false);
          dispatch(fetchPOs());
          alert("Purchase Order updated and submitted for approval.");
      } catch (e) {
          console.error(e);
          alert("Failed to update PO");
      } finally {
          setLocalLoading(false);
      }
  };

    const {
        filteredItems: filteredPos,
        pagedItems: pagedPos,
        page,
        totalItems,
        totalPages,
        setPage,
    } = useListControls({
        items: pos,
        searchTerm: search,
        filters,
        initialPageSize: 8,
        searchFn: (po, term) =>
            po.poNumber.toLowerCase().includes(term) ||
            (po.vendorName || '').toLowerCase().includes(term) ||
            (po.status || '').toLowerCase().includes(term) ||
            (po.id || '').toLowerCase().includes(term),
        filterFn: (po, activeFilters) =>
            activeFilters.status === 'all' || po.status === activeFilters.status,
    });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Action Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div>
              <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <ShoppingCart className="text-blue-600" size={28} /> Procurement Control
              </h1>
              <p className="text-sm text-slate-500 font-medium ml-10">Centralized Purchase Order Management & Vendor Coordination.</p>
          </div>
          {!isCreating && (
            <button 
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 text-sm font-bold active:scale-95"
            >
                <Plus size={18} /> Create New PO
            </button>
          )}
      </div>

      {isCreating && (
         <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-10 animate-fade-in-up relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
             
             <div className="flex justify-between items-center mb-10">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 shadow-inner">
                        <FileText size={28}/>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">New Purchase Order</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Inward Procurement Flow</p>
                    </div>
                 </div>
                 <button onClick={() => setIsCreating(false)} className="text-slate-300 hover:text-slate-600 transition-colors p-3 hover:bg-slate-50 rounded-full">
                    <Plus size={24} className="rotate-45" />
                 </button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-10">
                 <div className="space-y-3">
                     <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                         <User size={14} className="text-blue-500"/> Select Vendor / Supplier *
                     </label>
                     <select 
                        className="w-full border-2 border-slate-100 rounded-2xl p-4 text-sm bg-slate-50/50 focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-700 appearance-none shadow-sm"
                        value={newPO.vendorId}
                        onChange={e => {
                            const vId = e.target.value;
                            const updatedItems = newPO.items.map(item => {
                                const vendorPrice = priceMaps.find(m => 
                                    m.vendorId === vId && 
                                    (m.itemId === item.itemId || (m.itemName === item.itemName))
                                );
                                if (vendorPrice) {
                                    return { ...item, unitPrice: vendorPrice.price };
                                }
                                return item;
                            });
                            setNewPO({...newPO, vendorId: vId, items: updatedItems});
                        }}
                     >
                        <option value="">Choose Supplier from Master</option>
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.code})</option>)}
                     </select>
                 </div>
                 <div className="space-y-3">
                     <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                         <ClipboardList size={14} className="text-blue-500"/> Link Approved Requisition
                     </label>
                     <select 
                        className="w-full border-2 border-slate-100 rounded-2xl p-4 text-sm bg-slate-50/50 focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-700 appearance-none shadow-sm"
                        value={selectedPRId}
                        onChange={e => handlePRSelect(e.target.value)}
                     >
                        <option value="">Manual Entry (No PR)</option>
                        {prs.filter(p => p.status === 'Approved').map(p => (
                            <option key={p.id} value={p.id}>{p.prNumber} - {p.department} ({p.items.length} items)</option>
                        ))}
                     </select>
                 </div>
                 <div className="space-y-3">
                     <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                         <Calendar size={14} className="text-blue-500"/> Procurement Date
                     </label>
                     <div className="relative">
                        <Calendar className="absolute left-4 top-4 text-slate-400" size={18}/>
                        <input 
                            type="date" 
                            className="w-full border-2 border-slate-100 rounded-2xl pl-12 p-4 text-sm bg-slate-50/50 focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-700 shadow-sm"
                            value={newPO.date}
                            onChange={e => setNewPO({...newPO, date: e.target.value})}
                        />
                     </div>
                 </div>
                 <div className="space-y-3">
                     <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
                         <Calendar size={14} className="text-blue-500"/> Delivery Date
                     </label>
                     <div className="relative">
                        <Calendar className="absolute left-4 top-4 text-slate-400" size={18}/>
                        <input
                            type="date"
                            className="w-full border-2 border-slate-100 rounded-2xl pl-12 p-4 text-sm bg-slate-50/50 focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-slate-700 shadow-sm"
                            value={newPO.deliveryDate}
                            onChange={e => setNewPO({...newPO, deliveryDate: e.target.value})}
                        />
                     </div>
                 </div>
             </div>

             <div className="mb-10">
                 <div className="flex justify-between items-center mb-6 px-2">
                     <h3 className="font-black text-slate-800 text-sm flex items-center gap-3 uppercase tracking-widest">
                        <Package size={18} className="text-blue-500"/> Itemized product lines
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg shadow-blue-100">{newPO.items.length}</span>
                     </h3>
                     <button onClick={handleAddItem} className="text-xs font-black text-blue-600 hover:text-white hover:bg-blue-600 border-2 border-blue-600 px-4 py-2 rounded-xl transition-all uppercase tracking-widest flex items-center gap-2 active:scale-95 shadow-sm">
                        <Plus size={16} /> Add SKU
                     </button>
                 </div>
                 
                 <div className="border border-slate-100 rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-100 bg-white">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-slate-50/80 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-5">SKU / Item Details</th>
                                <th className="px-6 py-5 w-40">HSN / SAC</th>
                                <th className="px-6 py-5 w-24 text-center">Qty</th>
                                <th className="px-6 py-5 w-32">Unit Cost</th>
                                <th className="px-6 py-5 w-24 text-center">GST %</th>
                                <th className="px-6 py-5 w-40 text-right">Row Total</th>
                                <th className="px-6 py-5 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {newPO.items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-200">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                <Package size={40} className="opacity-20"/>
                                            </div>
                                            <p className="text-slate-400 text-sm font-black uppercase tracking-widest">Queue is Empty</p>
                                            <button onClick={handleAddItem} className="mt-4 text-blue-600 text-[10px] font-black hover:bg-blue-50 px-4 py-2 rounded-lg transition-all border border-blue-100 uppercase tracking-widest">Initialize First Line</button>
                                        </div>
                                    </td>
                                </tr>
                            ) : newPO.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-blue-50/20 transition-all group">
                                    <td className="px-6 py-6">
                                        <div className="flex flex-col gap-1.5">
                                            <select 
                                                className="w-full border-2 border-slate-50 rounded-xl p-3 text-sm bg-slate-50/50 focus:bg-white focus:border-blue-500/30 outline-none font-bold text-slate-700 transition-all"
                                                value={item.itemId}
                                                onChange={e => updateItem(idx, 'itemId', e.target.value)}
                                            >
                                                <option value="">Select Material / Product</option>
                                                {items.map(i => (
                                                    <option key={i.id} value={i.id}>
                                                        {i.name} - {i.sku}
                                                    </option>
                                                ))}
                                            </select>
                                            {item.itemId && (
                                                <div className="flex gap-2 ml-2">
                                                    <span className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded shadow-sm">
                                                        STOCK: {items.find(i => i.id === item.itemId)?.stock || 0}
                                                    </span>
                                                    <span className="text-[9px] font-black uppercase bg-slate-50 text-slate-400 px-2 py-0.5 rounded">
                                                        CAT: {items.find(i => i.id === item.itemId)?.category || 'General'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-3.5 text-slate-300" size={14}/>
                                            <input 
                                                type="text" className="w-full border-2 border-slate-50 rounded-xl pl-9 p-3 text-sm bg-slate-50 focus:bg-white focus:border-blue-500/30 outline-none font-mono font-bold text-blue-600 uppercase transition-all"
                                                value={item.hsnCode}
                                                onChange={e => updateItem(idx, 'hsnCode', e.target.value)}
                                                placeholder="HSN/SAC"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <input 
                                            type="number" className="w-full border-2 border-slate-50 rounded-xl p-3 text-sm bg-slate-50 focus:bg-white focus:border-blue-500/30 outline-none font-bold text-slate-700 text-center transition-all"
                                            value={item.quantity}
                                            onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                                        />
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="relative">
                                            <span className="absolute left-3 top-3 text-slate-300 font-bold">₹</span>
                                            <input 
                                                type="number" className="w-full border-2 border-slate-50 rounded-xl pl-7 p-3 text-sm bg-slate-50 focus:bg-white focus:border-blue-500/30 outline-none font-bold text-slate-700 transition-all"
                                                value={item.unitPrice}
                                                onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))}
                                            />
                                            {priceMaps.some(m => m.vendorId === newPO.vendorId && m.itemId === item.itemId && m.price === item.unitPrice) && (
                                                <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm z-10 animate-in zoom-in duration-300">
                                                    VPL
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <input 
                                            type="number" className="w-full border-2 border-slate-50 rounded-xl p-3 text-sm bg-slate-50 focus:bg-white focus:border-blue-500/30 outline-none font-bold text-slate-700 text-center transition-all"
                                            value={item.taxRate || 0}
                                            onChange={e => updateItem(idx, 'taxRate', Number(e.target.value))}
                                        />
                                    </td>
                                    <td className="px-6 py-6 text-right tabular-nums">
                                        <div className="font-black text-slate-900 text-lg">
                                            ₹{((item.quantity * item.unitPrice) * (1 + (item.taxRate || 0) / 100)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                        </div>
                                        <div className="text-[10px] text-emerald-600 font-black uppercase tracking-tighter mt-1">
                                            Incl. ₹{((item.quantity * item.unitPrice) * ((item.taxRate || 0) / 100)).toLocaleString("en-IN", { minimumFractionDigits: 2 })} Tax
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <button 
                                            onClick={() => {
                                                const updated = newPO.items.filter((_, i) => i !== idx);
                                                setNewPO({...newPO, items: updated});
                                            }}
                                            className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
                                        >
                                            <Plus size={22} className="rotate-45" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {newPO.items.length > 0 && (
                            <tfoot className="bg-slate-50/50 border-t-4 border-slate-100">
                                <tr>
                                    <td colSpan={3} className="px-6 py-4"></td>
                                    <td colSpan={2} className="px-6 py-4">
                                        <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                <span>Net Total:</span>
                                                <span className="text-slate-600">
                                                    ₹{newPO.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-bold text-emerald-500 uppercase tracking-widest">
                                                <span>Total Tax:</span>
                                                <span>
                                                    ₹{newPO.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice * ((i.taxRate || 0) / 100)), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <div className="h-px bg-slate-100 my-1"></div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Grand Total:</span>
                                                <span className="text-2xl font-black text-blue-600 tabular-nums">
                                                    ₹{newPO.items.reduce((sum, item) => {
                                                        const base = item.quantity * item.unitPrice;
                                                        const tax = base * ((item.taxRate || 0) / 100);
                                                        return sum + base + tax;
                                                    }, 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                  </div>
             </div>

             <div className="flex justify-end gap-6 pt-10 border-t border-slate-100">
                 <button 
                    onClick={() => setIsCreating(false)}
                    className="px-10 py-4 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all font-black text-xs uppercase tracking-widest"
                 >
                    Cancel Draft
                 </button>
                 <button 
                    onClick={handleCreate}
                    disabled={localLoading}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-16 py-4 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-3 shadow-2xl shadow-blue-200 font-black uppercase tracking-widest active:scale-95"
                 >
                    {localLoading ? <Loader2 className="animate-spin-slow" size={20}/> : <Check size={20}/>}
                    Confirm & Dispatch PO
                 </button>
             </div>
         </div>
      )}

      {/* PO List */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden animate-fade-in-up">
        <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600">
                    <FileText size={24}/>
                </div>
                <div>
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
                        Purchase Order Ledger
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Institutional Procurement Monitoring</p>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-72">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search PO, supplier, status..."
                        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10"
                    />
                </div>
                <div className="relative w-full sm:w-56">
                    <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10"
                    >
                        <option value="all">All statuses</option>
                        <option value="Draft">Draft</option>
                        <option value="Pending">Pending</option>
                        <option value="Pending Approval">Pending Approval</option>
                        <option value="Approved">Approved</option>
                        <option value="Sent">Sent</option>
                        <option value="Partial">Partial</option>
                        <option value="Completed">Completed</option>
                        <option value="Closed">Closed</option>
                    </select>
                </div>
                <div className="relative w-full sm:w-44">
                    <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                        value={filters.sortOrder}
                        onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })}
                        className="w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/10"
                    >
                        <option value="newest">Newest first</option>
                        <option value="earliest">Earliest first</option>
                    </select>
                </div>
                <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                    <button className="px-6 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200">Active Queue</button>
                    <button className="px-6 py-2 text-slate-400 hover:text-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">History</button>
                </div>
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/20 font-black tracking-[0.2em] border-b border-slate-100">
                <tr>
                    <th className="px-8 py-6">PO Ref</th>
                    <th className="px-8 py-6">Supplier Info</th>
                    <th className="px-8 py-6">Order Timeline</th>
                    <th className="px-8 py-6 text-right">Value</th>
                    <th className="px-8 py-6">Lifecycle Status</th>
                    <th className="px-8 py-6 text-center">Lines</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {loading && pos.length === 0 ? (
                    <tr><td colSpan={6} className="py-32 text-center">
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin-slow mb-6"></div>
                            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Establishing Secure Sync...</p>
                        </div>
                    </td></tr>
                ) : error ? (
                    <tr>
                        <td colSpan={6} className="py-32 text-center">
                            <div className="max-w-md mx-auto text-red-500 bg-red-50 p-8 rounded-[2rem] border border-red-100 shadow-xl shadow-red-100/50">
                                <AlertCircle className="mx-auto mb-4 text-red-400" size={48}/>
                                <p className="font-black uppercase tracking-[0.2em] text-xs">Ledger Access Restricted</p>
                                <p className="text-[11px] mt-2 font-bold opacity-80 leading-relaxed uppercase tracking-tight">{error}</p>
                            </div>
                        </td>
                    </tr>
                ) : filteredPos.length === 0 ? (
                    <tr><td colSpan={6} className="py-32 text-center">
                        <div className="flex flex-col items-center text-slate-200">
                            <div className="p-8 bg-slate-50 rounded-full mb-6">
                                <FileText size={64} className="opacity-10"/>
                            </div>
                            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">No Records Found</p>
                        </div>
                    </td></tr>
                ) : (
                    pagedPos.map((po) => (
                        <tr key={po.id} onClick={() => handleOpenDetail(po)} className="hover:bg-slate-50/80 cursor-pointer transition-all group border-l-4 border-l-transparent hover:border-l-blue-600">
                            <td className="px-8 py-7">
                                <div className="flex flex-col">
                                    <span className="font-black text-slate-900 group-hover:text-blue-600 transition-colors font-mono text-base tracking-tighter">
                                        #{po.poNumber}
                                    </span>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60">System ID: {po.id.slice(-6).toUpperCase()}</span>
                                </div>
                            </td>
                            <td className="px-8 py-7">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white to-slate-100 border border-slate-200 flex items-center justify-center text-sm font-black text-slate-700 shadow-sm group-hover:scale-110 group-hover:rotate-3 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                        {po.vendorName?.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <span className="font-black text-slate-800 block leading-tight text-base">{po.vendorName}</span>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Active Supplier</span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-7">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-slate-600 font-black text-xs uppercase tracking-tighter">
                                        <Calendar size={14} className="text-blue-400"/> {po.deliveryDate || po.date}
                                    </div>
                                    <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest ml-5">Delivery Date</span>
                                </div>
                            </td>
                            <td className="px-8 py-7 text-right">
                                <div className="flex flex-col items-end">
                                    <span className="font-black text-slate-900 text-xl tabular-nums tracking-tighter">
                                        ₹{(po.items?.reduce((sum, i) => {
                                            const base = i.quantity * i.unitPrice;
                                            const tax = base * ((i.taxRate || 0) / 100);
                                            return sum + base + tax;
                                        }, 0) || po.totalAmount || 0).toLocaleString("en-IN")}
                                    </span>
                                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">Incl. GST</span>
                                </div>
                            </td>
                            <td className="px-8 py-7">
                                <span className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm flex items-center justify-center w-32 ${
                                    po.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                    ['Sent', 'Approved', 'Partial', 'Delivered'].includes(po.status) ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                    po.status === 'Draft' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                    po.status === 'Pending' || po.status === 'Pending Approval' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                    'bg-slate-50 text-slate-500 border-slate-100'
                                }`}>
                                    {['Sent', 'Approved', 'Partial', 'Delivered'].includes(po.status) ? 'Pending' : po.status}
                                </span>
                            </td>
                            <td className="px-8 py-7 text-center">
                                <div className="inline-flex flex-col items-center group/badge">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-black group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 border-2 border-transparent group-hover:border-blue-200">
                                        {po.items.length}
                                    </div>
                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1.5 group-hover:text-blue-400 transition-colors">Line Items</span>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
          </table>
        </div>
                {totalItems > 0 && totalPages > 1 && (
                    <div className="px-8 pb-8 pt-4">
                        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                )}
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedPO && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="p-10">
                      <div className="flex justify-between items-start mb-10">
                          <div className="flex items-center gap-6">
                              <div className="p-5 bg-indigo-600 rounded-[1.5rem] text-white shadow-xl shadow-indigo-100">
                                  <FileText size={32} />
                              </div>
                              <div>
                                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">PO Details: #{selectedPO.poNumber}</h2>
                                  <div className="flex items-center gap-3 mt-2">
                                      <span className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                                          {selectedPO.status}
                                      </span>
                                      <span className="text-slate-300">|</span>
                                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order: {selectedPO.date}</span>
                                      {selectedPO.deliveryDate && (
                                          <>
                                              <span className="text-slate-300">|</span>
                                              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Delivery: {selectedPO.deliveryDate}</span>
                                          </>
                                      )}
                                  </div>
                              </div>
                          </div>
                          <button onClick={() => setIsDetailModalOpen(false)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-all">
                              <Plus size={24} className="rotate-45" />
                          </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                          <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 relative">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Supplier Allocation</h4>
                              {selectedPO.status === 'Draft' ? (
                                  <div className="space-y-4">
                                      <select 
                                          className="w-full border-2 border-white rounded-2xl p-4 text-sm bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-black text-slate-800 shadow-sm"
                                          value={updatingVendorId}
                                          onChange={e => {
                                              const vId = e.target.value;
                                              setUpdatingVendorId(vId);
                                              if (selectedPO) {
                                                  const updatedItems = selectedPO.items.map(item => {
                                                      const vendorPrice = priceMaps.find(m => 
                                                          m.vendorId === vId && 
                                                          (m.itemId === item.itemId || (m.itemName === item.itemName))
                                                      );
                                                      return {
                                                          ...item,
                                                          unitPrice: vendorPrice?.price || item.unitPrice
                                                      };
                                                  });
                                                  const newTotal = updatedItems.reduce((sum, item) => {
                                                      const base = item.quantity * item.unitPrice;
                                                      const tax = base * ((item.taxRate || 0) / 100);
                                                      return sum + base + tax;
                                                  }, 0);
                                                  setSelectedPO({
                                                      ...selectedPO,
                                                      items: updatedItems,
                                                      totalAmount: newTotal
                                                  });
                                              }
                                          }}
                                      >
                                          <option value="">Select Target Vendor</option>
                                          {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.code})</option>)}
                                      </select>
                                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-tight ml-2">Currently: {selectedPO.vendorName}</p>
                                  </div>
                              ) : (
                                  <div className="flex items-center gap-4">
                                      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-xl font-black text-indigo-600">
                                          {selectedPO.vendorName?.slice(0, 2).toUpperCase()}
                                      </div>
                                      <div>
                                          <p className="text-lg font-black text-slate-900 leading-tight">{selectedPO.vendorName}</p>
                                          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Verified Partner</p>
                                      </div>
                                  </div>
                              )}
                          </div>
                          <div className="p-8 bg-slate-900 rounded-[2rem] text-white">
                               <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Financial Summary</h4>
                               <div className="grid grid-cols-2 gap-4">
                                   <div>
                                       <p className="text-[10px] font-bold text-slate-400 uppercase">Gross Commitment</p>
                                       <p className="text-2xl font-black text-white mt-1 tabular-nums">₹{selectedPO.totalAmount.toLocaleString("en-IN")}</p>
                                   </div>
                                   <div className="text-right">
                                       <p className="text-[10px] font-bold text-slate-400 uppercase">Total GST</p>
                                       <p className="text-xl font-black text-emerald-400 mt-1 tabular-nums">
                                           ₹{selectedPO.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice * ((i.taxRate || 0) / 100)), 0).toLocaleString("en-IN")}
                                       </p>
                                   </div>
                                   <div className="col-span-2 pt-4 border-t border-white/10 flex justify-between items-center">
                                       <div>
                                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Payment Status</p>
                                           <span className="bg-white/10 text-white border border-white/20 mt-1 px-3 py-1 rounded-lg text-[10px] font-black uppercase inline-block">Pending</span>
                                       </div>
                                       <div className="text-right">
                                           <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Final Value</p>
                                           <p className="text-sm font-black text-white italic">Incl. all taxes</p>
                                       </div>
                                   </div>
                               </div>
                           </div>
                      </div>

                      <div className="mb-8">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Itemized Breakdown</h4>
                          <div className="max-h-[300px] overflow-y-auto border border-slate-100 rounded-[2rem] bg-white">
                              <table className="w-full text-sm text-left">
                                  <thead className="sticky top-0 bg-slate-50 text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-100">
                                       <tr>
                                           <th className="px-6 py-4">Material Name</th>
                                           <th className="px-6 py-4 text-center">Qty</th>
                                           <th className="px-6 py-4 text-center">HSN / GST</th>
                                           <th className="px-6 py-4 text-right">Unit Price</th>
                                           <th className="px-6 py-4 text-right">Line Total</th>
                                       </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                      {selectedPO.items.map((item, idx) => (
                                           <tr key={idx} className="hover:bg-slate-50/50">
                                               <td className="px-6 py-5">
                                                   <div className="font-black text-slate-800 leading-tight">{item.itemName}</div>
                                                   <div className="text-[9px] text-slate-400 font-bold font-mono uppercase mt-0.5">ID: {item.itemId}</div>
                                               </td>
                                               <td className="px-6 py-5 text-center font-bold text-slate-600">{item.quantity}</td>
                                               <td className="px-6 py-5 text-center">
                                                   <div className="text-[10px] font-bold text-slate-700">{item.hsnCode || 'N/A'}</div>
                                                   <div className="text-[9px] font-black text-indigo-500 uppercase">{item.taxRate}% GST</div>
                                               </td>
                                               <td className="px-6 py-5 text-right font-bold text-slate-600">₹{item.unitPrice.toLocaleString("en-IN")}</td>
                                               <td className="px-6 py-5 text-right">
                                                   <div className="font-black text-slate-900">₹{(item.quantity * item.unitPrice * (1 + (item.taxRate || 0) / 100)).toLocaleString("en-IN")}</div>
                                                   <div className="text-[9px] text-emerald-500 font-bold italic">Incl. Tax</div>
                                               </td>
                                           </tr>
                                       ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>

                      {selectedPO.status === 'Draft' && (
                          <div className="flex justify-end pt-6 border-t border-slate-100 gap-4">
                              <button 
                                  className="rounded-[1.5rem] px-8 py-4 text-slate-400 hover:text-slate-600 font-black text-xs uppercase tracking-widest transition-all"
                                  onClick={() => setIsDetailModalOpen(false)}
                              >
                                  Close
                              </button>
                              <button 
                                  className="rounded-[1.5rem] px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all flex items-center gap-2"
                                  onClick={handleUpdatePO}
                                  disabled={localLoading}
                              >
                                  {localLoading ? <Loader2 className="animate-spin-slow" size={18} /> : <Check size={18} />}
                                  Authorize & Submit for Approval
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default PurchaseOrderView;
;
