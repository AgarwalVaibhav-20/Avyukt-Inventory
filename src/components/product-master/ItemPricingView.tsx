import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService } from '@/services/productService';
import { InventoryItem } from '@/types';
import { IndianRupee, Save, Search, Loader2 } from 'lucide-react';
import Pagination from '@/components/common/Pagination';
import { useListControls } from '@/hooks/useListControls';

const ItemPricingView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [marginFilter, setMarginFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Local state for editing row
  const [editValues, setEditValues] = useState({ unitPrice: 0, mrp: 0, salePrice: 0 });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const sku = searchParams.get('sku');
    if (sku) setSearch(sku);
  }, [searchParams]);

  const loadData = async () => {
    setLoading(true);
    const data = await productService.getAllItems();
    setItems(data);
    setLoading(false);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditValues({
      unitPrice: item.unitPrice,
      mrp: item.mrp,
      salePrice: item.salePrice
    });
  };

  const handleSave = async (id: string) => {
    await productService.updateItemPricing(id, editValues);
    setEditingId(null);
    loadData();
  };

  const {
    filteredItems,
    pagedItems,
    page,
    pageSize,
    totalItems,
    totalPages,
    setPage,
    setPageSize,
  } = useListControls({
    items,
    searchTerm: search,
    filters: { margin: marginFilter },
    initialPageSize: 10,
    searchFn: (i, term) =>
      i.name.toLowerCase().includes(term) ||
      i.sku.toLowerCase().includes(term),
    filterFn: (i, filters) => {
      const margin = i.salePrice > 0 ? ((i.salePrice - i.unitPrice) / i.salePrice) * 100 : 0;
      if (filters.margin === 'low') return margin < 20;
      if (filters.margin === 'healthy') return margin >= 20;
      return true;
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <IndianRupee className="text-green-600" size={20}/> Item Pricing Master
            </h2>
            <div className="flex gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                <input 
                    type="text" 
                    placeholder="Search SKU or Name..." 
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select
                value={marginFilter}
                onChange={(e) => setMarginFilter(e.target.value)}
                className="w-40 px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="all">All margins</option>
                <option value="healthy">Healthy</option>
                <option value="low">Low margin</option>
              </select>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                    <tr>
                        <th className="px-6 py-4">Item Details</th>
                        <th className="px-6 py-4">Cost Price (CPU)</th>
                        <th className="px-6 py-4">MRP</th>
                        <th className="px-6 py-4">Sale Price</th>
                        <th className="px-6 py-4">Margin</th>
                        <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                        <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin-slow inline mr-2"/> Loading...</td></tr>
                    ) : filteredItems.length === 0 ? (
                        <tr><td colSpan={6} className="py-8 text-center text-slate-500">No items found.</td></tr>
                    ) : (
                        pagedItems.map(item => {
                            const isEditing = editingId === item.id;
                            const margin = item.salePrice > 0 ? ((item.salePrice - item.unitPrice) / item.salePrice) * 100 : 0;
                            
                            return (
                                <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-900">{item.name}</p>
                                        <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                                    </td>
                                    
                                    {/* Cost Price */}
                                    <td className="px-6 py-4">
                                        {isEditing ? (
                                            <input 
                                                type="number" className="w-24 border rounded px-2 py-1"
                                                value={editValues.unitPrice}
                                                onChange={e => setEditValues({...editValues, unitPrice: parseFloat(e.target.value)})}
                                            />
                                        ) : `₹${item.unitPrice.toFixed(2)}`}
                                    </td>

                                    {/* MRP */}
                                    <td className="px-6 py-4">
                                        {isEditing ? (
                                            <input 
                                                type="number" className="w-24 border rounded px-2 py-1"
                                                value={editValues.mrp}
                                                onChange={e => setEditValues({...editValues, mrp: parseFloat(e.target.value)})}
                                            />
                                        ) : `₹${item.mrp.toFixed(2)}`}
                                    </td>

                                    {/* Sale Price */}
                                    <td className="px-6 py-4 font-bold text-blue-600">
                                        {isEditing ? (
                                            <input 
                                                type="number" className="w-24 border border-blue-300 rounded px-2 py-1"
                                                value={editValues.salePrice}
                                                onChange={e => setEditValues({...editValues, salePrice: parseFloat(e.target.value)})}
                                            />
                                        ) : `₹${item.salePrice.toFixed(2)}`}
                                    </td>

                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-medium px-2 py-1 rounded ${margin >= 20 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {margin.toFixed(1)}%
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        {isEditing ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleSave(item.id)} className="text-green-600 hover:bg-green-50 p-1 rounded"><Save size={16}/></button>
                                                <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-100 p-1 rounded">Cancel</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => handleEdit(item)} className="text-blue-600 hover:underline text-sm">Edit</button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
};

export default ItemPricingView;
