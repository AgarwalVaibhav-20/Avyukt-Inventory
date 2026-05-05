import React, { useState, useEffect } from 'react';
import { vendorService } from '@/services/vendorService';
import { Vendor } from '@/types';
import { Users, Plus, Search, Edit, Trash2, Star, Loader2, Save, X } from 'lucide-react';

const VendorMasterView: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentVendor, setCurrentVendor] = useState<Partial<Vendor>>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await vendorService.getVendors();
    setVendors(data);
    setLoading(false);
  };

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
      if(!currentVendor.name || !currentVendor.code) return alert("Name and Code required");
      
      try {
          if(currentVendor.id) {
              await vendorService.updateVendor(currentVendor.id, currentVendor);
          } else {
              await vendorService.createVendor(currentVendor as Omit<Vendor, 'id' | 'rating'>);
          }
          setIsEditing(false);
          loadData();
      } catch(e) {
          alert("Error saving vendor");
      }
  };

  const handleDelete = async (id: string) => {
      if(confirm('Delete vendor?')) {
          await vendorService.deleteVendor(id);
          loadData();
      }
  };

  const filteredVendors = vendors.filter(v => 
      v.name.toLowerCase().includes(search.toLowerCase()) || 
      v.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users className="text-blue-600" size={20}/> Vendor Master
            </h2>
            <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                    <input 
                        type="text" 
                        placeholder="Search Vendors..." 
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <button type="button" onClick={handleAddNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex gap-2 items-center">
                    <Plus size={16}/> Add Vendor
                </button>
            </div>
        </div>

        {isEditing && (
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 animate-fade-in">
                <h3 className="font-bold text-slate-800 mb-4">{currentVendor.id ? 'Edit Vendor' : 'New Vendor'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Vendor Name</label>
                        <input className="w-full border rounded p-2 text-sm" value={currentVendor.name || ''} onChange={e => setCurrentVendor({...currentVendor, name: e.target.value})}/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Code</label>
                        <input className="w-full border rounded p-2 text-sm" value={currentVendor.code || ''} onChange={e => setCurrentVendor({...currentVendor, code: e.target.value})}/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Status</label>
                        <select className="w-full border rounded p-2 text-sm" value={currentVendor.status} onChange={e => setCurrentVendor({...currentVendor, status: e.target.value as any})}>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Pending Approval">Pending Approval</option>
                            <option value="Blacklisted">Blacklisted</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Contact Person</label>
                        <input className="w-full border rounded p-2 text-sm" value={currentVendor.contactPerson || ''} onChange={e => setCurrentVendor({...currentVendor, contactPerson: e.target.value})}/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
                        <input className="w-full border rounded p-2 text-sm" value={currentVendor.email || ''} onChange={e => setCurrentVendor({...currentVendor, email: e.target.value})}/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Phone</label>
                        <input className="w-full border rounded p-2 text-sm" value={currentVendor.phone || ''} onChange={e => setCurrentVendor({...currentVendor, phone: e.target.value})}/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Category</label>
                        <input className="w-full border rounded p-2 text-sm" value={currentVendor.category || ''} onChange={e => setCurrentVendor({...currentVendor, category: e.target.value})}/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Tax ID / GSTIN</label>
                        <input className="w-full border rounded p-2 text-sm" value={currentVendor.taxId || ''} onChange={e => setCurrentVendor({...currentVendor, taxId: e.target.value})}/>
                    </div>
                    <div className="md:col-span-3">
                        <label className="block text-xs font-bold text-slate-600 mb-1">Address</label>
                        <textarea className="w-full border rounded p-2 text-sm" rows={2} value={currentVendor.address || ''} onChange={e => setCurrentVendor({...currentVendor, address: e.target.value})}/>
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 bg-white border rounded text-slate-600 hover:bg-slate-50 text-sm">Cancel</button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-2"><Save size={16}/> Save Vendor</button>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? <div className="col-span-3 text-center py-8"><Loader2 className="animate-spin inline"/></div> :
             filteredVendors.map(v => (
                <div key={v.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow relative">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-bold text-slate-800">{v.name}</h3>
                            <p className="text-xs text-slate-500 font-mono">{v.code}</p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-1 text-amber-500 text-sm font-bold">
                                <Star size={14} fill="currentColor"/> {v.rating}
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block ${
                                v.status === 'Active' ? 'bg-green-100 text-green-700' : 
                                v.status === 'Blacklisted' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                                {v.status}
                            </span>
                        </div>
                    </div>
                    <div className="text-sm text-slate-600 space-y-1 mb-4">
                        <p>{v.contactPerson}</p>
                        <p className="text-slate-400">{v.email}</p>
                        <p className="text-slate-400">{v.phone}</p>
                    </div>
                    <div className="flex border-t pt-3 gap-2">
                        <button type="button" onClick={() => handleEdit(v)} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1">
                            <Edit size={14}/> Edit
                        </button>
                        <button type="button" onClick={() => handleDelete(v.id)} classNameName="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1">
                            <Trash2 size={14}/> Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default VendorMasterView;
