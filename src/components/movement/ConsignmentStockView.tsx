import React, { useState, useEffect } from 'react';
import { InventoryItem, ConsignmentEntry, Warehouse } from '@/types';
import { Briefcase, ArrowRight, ArrowLeft, Loader2, Search, Filter, Plus, User, Package, Calendar, Clock, CheckCircle2, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createConsignmentEntry, fetchStockMovementData } from '@/store/slices/stockMovementSlice';

const ConsignmentStockView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { consignments, items, actionLoading, error, loading } = useAppSelector((state) => state.stockMovement);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
      type: 'Outward' as 'Outward' | 'Inward',
      partyId: '',
      partyName: '',
      itemId: '',
      quantity: 1,
      notes: ''
  });

  useEffect(() => {
    dispatch(fetchStockMovementData());
  }, [dispatch]);

  const handleSubmit = async () => {
      if(!formData.partyName || !formData.itemId) return alert("Please fill in the party name and select an item.");
      if(formData.quantity <= 0) return alert("Quantity must be greater than zero.");
      
      const item = items.find(i => i.id === formData.itemId);

      try {
          await dispatch(createConsignmentEntry({
              ...formData,
              itemName: item?.name || 'Unknown',
          })).unwrap();
          
          setFormData({
            type: 'Outward',
            partyId: '',
            partyName: '',
            itemId: '',
            quantity: 1,
            notes: ''
          });
      } catch(e) { 
        console.error("Consignment creation failed", e);
      }
  };

  const typedItems = items as InventoryItem[];
  const typedConsignments = consignments as ConsignmentEntry[];

  const filteredConsignments = typedConsignments.filter(c => 
    c.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
       {/* Dashboard Header */}
       <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-5">
             <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-blue-100">
                <Briefcase size={32}/>
             </div>
             <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Consignment Inventory</h1>
                <p className="text-sm text-slate-500 font-medium">Manage stock held by partners or received on consignment basis.</p>
             </div>
          </div>
          <div className="flex gap-4">
             <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Active</p>
                <p className="text-xl font-black text-slate-800">{typedConsignments.length}</p>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Action Form */}
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <h2 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-3 uppercase tracking-widest">
                   <Plus className="text-blue-600" size={20}/> New Consignment Entry
                </h2>

                <div className="space-y-6">
                   <div>
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                         <TrendingUp size={14} className="text-blue-500"/> Movement Type
                      </label>
                      <div className="grid grid-cols-2 gap-3 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                         <button 
                            onClick={() => setFormData({...formData, type: 'Outward'})}
                            className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.type === 'Outward' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                         >
                            Outward
                         </button>
                         <button 
                            onClick={() => setFormData({...formData, type: 'Inward'})}
                            className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.type === 'Inward' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                         >
                            Inward
                         </button>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 ml-1">
                         <User size={14} className="text-blue-500"/> Partner / Party Name *
                      </label>
                      <input
                        type="text"
                        className="w-full border-2 border-slate-50 rounded-2xl p-4 text-sm bg-slate-50 focus:bg-white focus:border-blue-500/30 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-bold text-slate-700 shadow-sm"
                        value={formData.partyName}
                        onChange={e => setFormData({...formData, partyName: e.target.value})}
                        placeholder={formData.type === 'Outward' ? 'Consignee (Customer)' : 'Consignor (Supplier)'}
                      />
                   </div>

                   <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 ml-1">
                         <Package size={14} className="text-blue-500"/> Material Selection *
                      </label>
                      <select 
                        className="w-full border-2 border-slate-50 rounded-2xl p-4 text-sm bg-slate-50 focus:bg-white focus:border-blue-500/30 outline-none font-bold text-slate-700 transition-all shadow-sm appearance-none"
                        value={formData.itemId}
                        onChange={e => setFormData({...formData, itemId: e.target.value})}
                      >
                          <option value="">Choose Inventory SKU</option>
                          {typedItems.map(i => (
                            <option key={i.id} value={i.id}>
                              {i.sku} — {i.name}
                            </option>
                          ))}
                      </select>
                   </div>

                   <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-3">
                         <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 ml-1">
                            <Clock size={14} className="text-blue-500"/> Transfer Quantity
                         </label>
                         <input 
                           type="number" 
                           className="w-full border-2 border-slate-50 rounded-2xl p-4 text-sm bg-slate-50 focus:bg-white focus:border-blue-500/30 outline-none font-black text-slate-800 shadow-sm" 
                           value={formData.quantity} 
                           onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                         />
                      </div>
                   </div>

                   <button 
                      onClick={handleSubmit} 
                      disabled={actionLoading} 
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 rounded-[1.5rem] hover:from-blue-700 hover:to-indigo-700 transition-all shadow-2xl shadow-blue-200 font-black flex justify-center items-center gap-3 uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50 mt-4"
                   >
                       {actionLoading ? <Loader2 className="animate-spin" size={20}/> : <Briefcase size={20}/>} 
                       Execute Consignment
                   </button>
                </div>
             </div>

             {error && (
                <div className="rounded-[1.5rem] border-2 border-red-100 bg-red-50 p-5 flex items-start gap-4 animate-shake">
                   <AlertCircle className="text-red-500 shrink-0" size={20}/>
                   <div>
                      <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Processing Error</p>
                      <p className="text-xs font-bold text-red-400 leading-relaxed">{error}</p>
                   </div>
                </div>
             )}
          </div>

          {/* Registry Table */}
          <div className="lg:col-span-8 space-y-6">
             <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden min-h-[600px]">
                <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600">
                            <Briefcase size={24}/>
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">
                                Movement Ledger
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time Consignment Tracking</p>
                        </div>
                    </div>
                    
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search Ledger..." 
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/30 outline-none transition-all shadow-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/20 font-black tracking-[0.2em] border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-6">Reference</th>
                                <th className="px-8 py-6">Timeline</th>
                                <th className="px-8 py-6">Flow</th>
                                <th className="px-8 py-6">Stakeholder</th>
                                <th className="px-8 py-6">Item Detail</th>
                                <th className="px-8 py-6 text-right">Qty</th>
                                <th className="px-8 py-6 text-center">Lifecycle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading && filteredConsignments.length === 0 ? (
                                <tr>
                                   <td colSpan={7} className="py-40 text-center">
                                      <div className="w-16 h-16 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
                                      <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Accessing Vault Data...</p>
                                   </td>
                                </tr>
                            ) : filteredConsignments.length === 0 ? (
                                <tr>
                                   <td colSpan={7} className="py-40 text-center">
                                      <div className="flex flex-col items-center text-slate-200">
                                          <div className="p-10 bg-slate-50 rounded-full mb-6">
                                              <Briefcase size={80} className="opacity-10"/>
                                          </div>
                                          <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Registry is empty</p>
                                      </div>
                                   </td>
                                </tr>
                            ) : (
                                filteredConsignments.map(c => (
                                    <tr key={c.id} className="hover:bg-slate-50/80 transition-all group border-l-4 border-l-transparent hover:border-l-blue-600">
                                        <td className="px-8 py-7">
                                           <span className="font-black text-slate-900 group-hover:text-blue-600 transition-colors font-mono text-xs uppercase tracking-tighter">
                                               {c.reference}
                                           </span>
                                        </td>
                                        <td className="px-8 py-7">
                                           <div className="flex flex-col">
                                              <span className="text-slate-700 font-black text-xs uppercase tracking-tight">{c.date}</span>
                                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60">Posted</span>
                                           </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            {c.type === 'Outward' 
                                              ? <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase bg-orange-50 text-orange-600 border border-orange-100 shadow-sm"><TrendingUp size={12}/> Out</span>
                                              : <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm"><TrendingDown size={12}/> In</span>}
                                        </td>
                                        <td className="px-8 py-7 font-black text-slate-800 text-xs uppercase tracking-tight">
                                            {c.partyName}
                                        </td>
                                        <td className="px-8 py-7">
                                           <div className="flex flex-col">
                                              <span className="text-slate-900 font-black text-xs uppercase tracking-tighter">{c.itemName}</span>
                                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60">Serialized SKU</span>
                                           </div>
                                        </td>
                                        <td className="px-8 py-7 text-right font-black text-slate-900 text-base tabular-nums">
                                            {c.quantity}
                                        </td>
                                        <td className="px-8 py-7 text-center">
                                            <span className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                                                c.status === 'Active' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                c.status === 'Settled' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                'bg-slate-50 text-slate-400 border-slate-100'
                                            }`}>
                                                {c.status}
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
       </div>
    </div>
  );
};

export default ConsignmentStockView;
