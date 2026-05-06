import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchVendors, createVendor, updateVendor, deleteVendor } from '@/store/slices/procurementSlice';
import { Vendor } from '@/types';
import { Users, Plus, Search, Edit, Trash2, Star, Loader2, Save, X, Phone, Mail, User, MapPin, ShieldCheck, AlertCircle } from 'lucide-react';

const VendorMasterView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { vendors, loading, error } = useAppSelector((state) => state.procurement);
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentVendor, setCurrentVendor] = useState<Partial<Vendor>>({});
  const [search, setSearch] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchVendors());
  }, [dispatch]);

  const handleEdit = (v: Vendor) => {
      setCurrentVendor(v);
      setIsEditing(true);
  };

  const handleAddNew = () => {
      setCurrentVendor({ 
          status: 'Active', 
          code: '', 
          name: '', 
          email: '', 
          phone: '', 
          contactPerson: '', 
          category: '', 
          address: '',
          taxId: ''
      });
      setIsEditing(true);
  };

  const handleSave = async () => {
      if(!currentVendor.name || !currentVendor.code) return alert("Vendor Name and Unique Code are required.");
      
      setLocalLoading(true);
      try {
          if(currentVendor.id) {
              await dispatch(updateVendor({ id: currentVendor.id, updates: currentVendor })).unwrap();
          } else {
              await dispatch(createVendor(currentVendor as Omit<Vendor, 'id' | 'rating'>)).unwrap();
          }
          setIsEditing(false);
          alert("Vendor profile saved successfully.");
      } catch(e) {
          console.error(e);
          alert("Failed to save vendor details.");
      } finally {
          setLocalLoading(false);
      }
  };

  const handleDelete = async (id: string) => {
      if(window.confirm('Are you sure you want to remove this vendor from the system?')) {
          try {
              await dispatch(deleteVendor(id)).unwrap();
          } catch (e) {
              alert("Error deleting vendor.");
          }
      }
  };

  const filteredVendors = vendors.filter(v => 
      v.name.toLowerCase().includes(search.toLowerCase()) || 
      v.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Vendor Master</h1>
                <p className="text-sm text-slate-500">Maintain records of suppliers and service providers.</p>
            </div>
            {!isEditing && (
                <button 
                    onClick={handleAddNew} 
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 text-sm font-bold flex gap-2 items-center"
                >
                    <Plus size={18}/> New Vendor
                </button>
            )}
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-3 text-slate-400" size={18}/>
                <input 
                    type="text" 
                    placeholder="Search by Vendor Name, ID, or Phone..." 
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
                Total: <span className="text-slate-800 text-sm">{vendors.length}</span>
            </div>
        </div>

        {/* Editor Modal/Section */}
        {isEditing && (
            <div className="bg-white rounded-3xl border border-blue-100 shadow-2xl p-8 animate-fade-in-up relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-black text-slate-800">{currentVendor.id ? 'Refine Vendor Profile' : 'Onboard New Vendor'}</h3>
                        <p className="text-xs text-slate-500 font-medium">Fields marked with * are mandatory for PO generation.</p>
                    </div>
                    <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor Name *</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-slate-300" size={16}/>
                            <input className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold" value={currentVendor.name || ''} onChange={e => setCurrentVendor({...currentVendor, name: e.target.value})} placeholder="e.g. Global Logistics Inc."/>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Internal Code *</label>
                        <input className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-mono font-bold" value={currentVendor.code || ''} onChange={e => setCurrentVendor({...currentVendor, code: e.target.value})} placeholder="VND-001"/>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Account Status</label>
                        <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold" value={currentVendor.status} onChange={e => setCurrentVendor({...currentVendor, status: e.target.value as any})}>
                            <option value="Active">Active / Approved</option>
                            <option value="Inactive">Inactive / Suspended</option>
                            <option value="Pending Approval">Pending Verification</option>
                            <option value="Blacklisted">Blacklisted / Restricted</option>
                        </select>
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Person</label>
                        <input className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white outline-none transition-all font-medium" value={currentVendor.contactPerson || ''} onChange={e => setCurrentVendor({...currentVendor, contactPerson: e.target.value})} placeholder="Manager Name"/>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-300" size={16}/>
                            <input className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white outline-none transition-all font-medium" value={currentVendor.email || ''} onChange={e => setCurrentVendor({...currentVendor, email: e.target.value})} placeholder="vendor@example.com"/>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Phone / Mobile</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 text-slate-300" size={16}/>
                            <input className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white outline-none transition-all font-medium" value={currentVendor.phone || ''} onChange={e => setCurrentVendor({...currentVendor, phone: e.target.value})} placeholder="+1 234 567 890"/>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Business Category</label>
                        <input className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white outline-none transition-all font-medium" value={currentVendor.category || ''} onChange={e => setCurrentVendor({...currentVendor, category: e.target.value})} placeholder="e.g. Raw Materials"/>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Tax ID / GSTIN</label>
                        <input className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white outline-none transition-all font-medium" value={currentVendor.taxId || ''} onChange={e => setCurrentVendor({...currentVendor, taxId: e.target.value})} placeholder="GSTIN-99008877"/>
                    </div>
                    <div className="md:col-span-3 space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Full Office Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-slate-300" size={16}/>
                            <textarea className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white outline-none transition-all font-medium" rows={2} value={currentVendor.address || ''} onChange={e => setCurrentVendor({...currentVendor, address: e.target.value})} placeholder="Street, City, State, Country, Zip"/>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                    <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 text-sm font-bold transition-colors">Discard</button>
                    <button type="button" onClick={handleSave} disabled={localLoading} className="px-10 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-black flex items-center gap-2 shadow-lg shadow-blue-100">
                        {localLoading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                        Confirm & Save
                    </button>
                </div>
            </div>
        )}

        {/* Vendors Grid */}
        {loading && vendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={40}/>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Vendor Database...</p>
            </div>
        ) : filteredVendors.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
                <ShieldCheck className="text-slate-200 mx-auto mb-4" size={60}/>
                <h3 className="text-xl font-bold text-slate-700">No Vendors Found</h3>
                <p className="text-slate-500 text-sm">We couldn't find any vendors matching "{search}". Try a different term or onboard a new partner.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredVendors.map(v => (
                    <div key={v.id} className="group bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-2xl hover:border-blue-200 transition-all duration-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                            <Users size={80} />
                        </div>
                        
                        <div className="flex justify-between items-start mb-6">
                            <div className="shrink-0 w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <User size={24}/>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center justify-end gap-1 text-amber-500 text-sm font-black mb-1">
                                    <Star size={14} fill="currentColor"/> {v.rating || '5.0'}
                                </div>
                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-tighter border ${
                                    v.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                    v.status === 'Blacklisted' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}>
                                    {v.status}
                                </span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="font-black text-slate-800 text-xl leading-tight mb-1 group-hover:text-blue-600 transition-colors">{v.name}</h3>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest font-mono">{v.code}</p>
                        </div>

                        <div className="space-y-3 mb-8">
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <User size={14} className="text-slate-300"/>
                                <span className="font-medium">{v.contactPerson || 'No Contact Assigned'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-400">
                                <Mail size={14} className="text-slate-300"/>
                                <span className="truncate">{v.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-400">
                                <Phone size={14} className="text-slate-300"/>
                                <span>{v.phone || 'N/A'}</span>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-50">
                            <button type="button" onClick={() => handleEdit(v)} className="flex-1 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                                Edit Profile
                            </button>
                            <button type="button" onClick={() => handleDelete(v.id)} className="p-2.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all">
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

export default VendorMasterView;
