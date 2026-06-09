import React, { useState, useEffect } from 'react';
import { vendorService } from '@/services/vendorService';
import { productService } from '@/services/productService';
import { Vendor, InventoryItem, VendorItemMap } from '@/types';
import { IndianRupee, Search, Plus, Trash2, Save, Loader2, X } from 'lucide-react';
import Pagination from '@/components/common/Pagination';
import { useListControls } from '@/hooks/useListControls';

const VendorPriceListView: React.FC = () => {
  const [maps, setMaps] = useState<VendorItemMap[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
      vendorId: '',
      itemId: '',
      price: 0,
      currency: 'USD',
      leadTimeDays: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [mData, vData, iData] = await Promise.all([
        vendorService.getVendorItemMaps(),
        vendorService.getVendors(),
        productService.getAllItems()
    ]);
    setMaps(mData);
    setVendors(vData);
    setItems(iData);
    setLoading(false);
  };

  const handleSave = async () => {
      if(!form.vendorId || !form.itemId) return alert("Select Vendor and Item");
      const vendor = vendors.find(v => v.id === form.vendorId);
      const item = items.find(i => i.id === form.itemId);
      
      try {
          await vendorService.saveVendorItemMap({
              ...form,
              vendorName: vendor?.name || 'Unknown',
              itemName: item?.name || 'Unknown',
              sku: item?.sku || '',
              vendorSku: '' // Optional
          });
          setIsAdding(false);
          setForm({ vendorId: '', itemId: '', price: 0, currency: 'USD', leadTimeDays: 0 });
          loadData();
      } catch (error) {
          alert((error as any)?.response?.data?.message || (error as any)?.response?.data?.error || 'Failed to save price entry');
      }
  };

  const handleDelete = async (id: string) => {
      if(confirm("Remove this price mapping?")) {
          await vendorService.deleteVendorItemMap(id);
          loadData();
      }
  };

  const {
      filteredItems: filteredMaps,
      pagedItems: pagedMaps,
      page,
      totalPages,
      totalItems,
      setPage,
  } = useListControls({
      items: maps,
      searchTerm: search,
      initialPageSize: 8,
      searchFn: (map, term) =>
          map.vendorName.toLowerCase().includes(term) ||
          map.itemName.toLowerCase().includes(term),
  });

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <IndianRupee className="text-green-600" size={20}/> Vendor Price List
                </h2>
                <button type="button" onClick={() => setIsAdding(!isAdding)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium flex gap-2">
                    <Plus size={16}/> Add Price
                </button>
            </div>

            {isAdding && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-green-800 mb-1">Vendor</label>
                            <select className="w-full border rounded p-2 text-sm" value={form.vendorId} onChange={e => setForm({...form, vendorId: e.target.value})}>
                                <option value="">Select Vendor</option>
                                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-green-800 mb-1">Item</label>
                            <select className="w-full border rounded p-2 text-sm" value={form.itemId} onChange={e => setForm({...form, itemId: e.target.value})}>
                                <option value="">Select Item</option>
                                {items.length === 0 ? (
                                    <option value="" disabled>No items available</option>
                                ) : (
                                    items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)
                                )}
                            </select>
                            {items.length === 0 && <p className="text-xs text-slate-400 mt-1">No items found. Ensure you're logged in and your organisation has items.</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-green-800 mb-1">Price</label>
                            <input type="number" className="w-full border rounded p-2 text-sm" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})}/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-green-800 mb-1">Currency</label>
                            <select className="w-full border rounded p-2 text-sm" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="INR">INR</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-green-800 mb-1">Lead Time (Days)</label>
                            <input type="number" className="w-full border rounded p-2 text-sm" value={form.leadTimeDays} onChange={e => setForm({...form, leadTimeDays: Number(e.target.value)})}/>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-500 text-sm">Cancel</button>
                        <button type="button" onClick={handleSave} disabled={!form.vendorId || !form.itemId || items.length === 0 || vendors.length === 0} className={`px-6 py-2 rounded text-sm ${(!form.vendorId || !form.itemId || items.length === 0 || vendors.length === 0) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                            Save Price
                        </button>
                    </div>
                </div>
            )}

            <div className="mb-4">
                <input 
                    type="text" 
                    placeholder="Filter by Vendor or Item..." 
                    className="w-full border rounded p-2 text-sm"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Item</th>
                            <th className="px-6 py-4">Vendor</th>
                            <th className="px-6 py-4 text-right">Price</th>
                            <th className="px-6 py-4 text-center">Lead Time</th>
                            <th className="px-6 py-4 text-right">Last Updated</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin inline"/></td></tr> :
                         filteredMaps.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-slate-500">No vendor price records found.</td></tr> :
                         pagedMaps.map(m => (
                            <tr key={m.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-800">{m.itemName}</p>
                                    <p className="text-xs text-slate-500">{m.sku}</p>
                                </td>
                                <td className="px-6 py-4">{m.vendorName}</td>
                                <td className="px-6 py-4 text-right font-mono font-medium text-green-700">
                                    {m.price.toFixed(2)} {m.currency}
                                </td>
                                <td className="px-6 py-4 text-center">{m.leadTimeDays} Days</td>
                                <td className="px-6 py-4 text-right text-slate-500 text-xs">{m.lastUpdated}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleDelete(m.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {totalItems > 0 && totalPages > 1 && (
                <div className="mt-6">
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
            )}
        </div>
    </div>
  );
};

export default VendorPriceListView;
