import React, { useState, useEffect } from 'react';
import { stockControlService } from '@/services/stockControlService';
import { Package, Search, Loader2 } from 'lucide-react';

const ItemWiseValuationView: React.FC = () => {
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await stockControlService.getValuationReport();
    setReport(data);
    setLoading(false);
  };

  const filtered = report.filter(i => 
      i.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      i.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Package className="text-blue-600" size={20}/> Item-wise Valuation
                    </h2>
                    <p className="text-sm text-slate-500">Breakdown of inventory value by SKU.</p>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                    <input 
                        type="text" 
                        placeholder="Search Item..." 
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Item Details</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4 text-right">Stock Qty</th>
                            <th className="px-6 py-4 text-right">Unit Value ({report[0]?.method || 'FIFO'})</th>
                            <th className="px-6 py-4 text-right">Total Value</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={5} className="py-8 text-center"><Loader2 className="animate-spin inline mr-2"/> Calculating...</td></tr> :
                         filtered.length === 0 ? <tr><td colSpan={5} className="py-8 text-center text-slate-500">No items found.</td></tr> :
                         filtered.map(item => (
                            <tr key={item.itemId} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-800">{item.itemName}</p>
                                    <p className="text-xs text-slate-500">{item.sku}</p>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{item.category}</td>
                                <td className="px-6 py-4 text-right font-medium">{item.stock}</td>
                                <td className="px-6 py-4 text-right text-slate-600">${item.unitValuation.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right font-bold text-blue-700">${item.totalValuation.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold text-slate-800">
                        <tr>
                            <td colSpan={4} className="px-6 py-4 text-right">Grand Total:</td>
                            <td className="px-6 py-4 text-right">${filtered.reduce((sum, i) => sum + i.totalValuation, 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </div>
  );
};

export default ItemWiseValuationView;
