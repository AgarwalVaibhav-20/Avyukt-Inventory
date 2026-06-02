import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Save, X, Edit2, Loader2, ChevronLeft, ChevronRight, Check, ChevronsUpDown } from "lucide-react";
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMasterData } from '@/store/slices/masterSlice';
import { qualityService } from '@/services/qualityService';
import { QualityParameter } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const QualityParametersView: React.FC = () => {
  const [data, setData] = useState<QualityParameter[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<QualityParameter>>({});
  const [openUomDropdown, setOpenUomDropdown] = useState(false);

  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { data: masterData } = useAppSelector((state) => state.master);
  
  const uoms = Array.isArray(masterData['uom']) ? masterData['uom'] : [];
  const organisationId = user?.organisationId || localStorage.getItem("organisationId");

  useEffect(() => {
    if (organisationId && uoms.length === 0) {
      dispatch(fetchMasterData({ type: 'uom', organisationId }));
    }
  }, [dispatch, organisationId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await qualityService.getPaginatedParameters(page, limit, searchTerm);
      setData(result.data);
      setTotal(result.total);
    } catch (error: any) {
      alert("Failed to load quality parameters: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search slightly or let user click search. For simplicity, just reload on dependencies.
    const timer = setTimeout(() => {
        loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, limit, searchTerm]);

  const handleSave = async () => {
    if (!formData.name) {
      alert("Parameter name is required");
      return;
    }

    try {
      if (editingId) {
        await qualityService.updateParameter(editingId, formData);
        alert("Parameter updated successfully!");
      } else {
        await qualityService.addParameter(formData as any);
        alert("Parameter added successfully!");
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({});
      loadData();
    } catch (error: any) {
      alert("Error saving parameter: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this parameter?")) {
      try {
        await qualityService.deleteParameter(id);
        loadData();
      } catch (error: any) {
        alert("Error deleting parameter: " + (error.response?.data?.message || error.message));
      }
    }
  };

  const startEdit = (item: QualityParameter) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      uom: item.uom,
      type: item.type,
      description: item.description
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quality Parameters</h2>
          <p className="text-sm text-slate-500">Define standard test parameters (e.g., pH, Dimensions, Weight) used in inspection plans.</p>
        </div>
        <button
          onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ type: 'Numeric' }); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
        >
          <Plus size={16} /> Add New
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search parameters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
             <span className="text-sm text-slate-500">Records per page:</span>
             <select 
               value={limit} 
               onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
               className="border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
             >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
             </select>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Parameter Name</th>
                <th className="px-6 py-4 font-medium">Unit (UoM)</th>
                <th className="px-6 py-4 font-medium">Data Type</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(isAdding || editingId === 'new') && (
                <tr className="bg-blue-50/50">
                  <td className="px-6 py-4">
                    <input autoFocus type="text" placeholder="e.g. Length" className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </td>
                  <td className="px-6 py-4">
                    <Popover open={openUomDropdown && isAdding} onOpenChange={(open) => setOpenUomDropdown(open)}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between font-normal text-sm h-8 px-2 border-blue-300 hover:bg-slate-50"
                        >
                          {formData.uom ? formData.uom : "Select UoM..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search UoM..." />
                          <CommandList>
                            <CommandEmpty>No UoM found.</CommandEmpty>
                            <CommandGroup>
                              {uoms.map((u: any, idx: number) => (
                                <CommandItem
                                  key={u.id || idx}
                                  value={u.name}
                                  onSelect={() => {
                                    setFormData({ ...formData, uom: u.name });
                                    setOpenUomDropdown(false);
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", formData.uom === u.name ? "opacity-100" : "opacity-0")} />
                                  {u.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </td>
                  <td className="px-6 py-4">
                    <select className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.type || "Numeric"} onChange={(e) => setFormData({ ...formData, type: e.target.value as "Numeric" | "Pass/Fail" | "Text" })}>
                       <option value="Numeric">Numeric</option>
                       <option value="Pass/Fail">Pass/Fail</option>
                       <option value="Text">Text</option>
                       <option value="Percentage">Percentage</option>
                       <option value="Boolean">Boolean</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <input type="text" placeholder="Description" className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={handleSave} className="text-green-600 hover:bg-green-100 p-1 rounded"><Save size={18} /></button>
                      <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-red-600 hover:bg-red-100 p-1 rounded"><X size={18} /></button>
                    </div>
                  </td>
                </tr>
              )}

              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={20} /> Loading data...</div>
                  </td>
                </tr>
              ) : data.length === 0 && !isAdding ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500">No records found.</td></tr>
              ) : (
                data.map((item) => (
                  editingId === item.id ? (
                     <tr key={item.id} className="bg-blue-50/50">
                        <td className="px-6 py-4">
                            <input autoFocus type="text" className="w-full border border-blue-300 rounded px-2 py-1 text-sm" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </td>
                        <td className="px-6 py-4">
                          <Popover open={openUomDropdown && editingId === item.id} onOpenChange={(open) => setOpenUomDropdown(open)}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between font-normal text-sm h-8 px-2 border-blue-300 hover:bg-slate-50"
                              >
                                {formData.uom ? formData.uom : "Select UoM..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search UoM..." />
                                <CommandList>
                                  <CommandEmpty>No UoM found.</CommandEmpty>
                                  <CommandGroup>
                                    {uoms.map((u: any, idx: number) => (
                                      <CommandItem
                                        key={u.id || idx}
                                        value={u.name}
                                        onSelect={() => {
                                          setFormData({ ...formData, uom: u.name });
                                          setOpenUomDropdown(false);
                                        }}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", formData.uom === u.name ? "opacity-100" : "opacity-0")} />
                                        {u.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </td>
                        <td className="px-6 py-4">
                            <select className="w-full border border-blue-300 rounded px-2 py-1 text-sm" value={formData.type || "Numeric"} onChange={(e) => setFormData({ ...formData, type: e.target.value as "Numeric" | "Pass/Fail" | "Text" })}>
                            <option value="Numeric">Numeric</option>
                            <option value="Pass/Fail">Pass/Fail</option>
                            <option value="Text">Text</option>
                            <option value="Percentage">Percentage</option>
                            <option value="Boolean">Boolean</option>
                            </select>
                        </td>
                        <td className="px-6 py-4">
                            <input type="text" className="w-full border border-blue-300 rounded px-2 py-1 text-sm" value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                            <button onClick={handleSave} className="text-green-600 hover:bg-green-100 p-1 rounded"><Save size={18} /></button>
                            <button onClick={() => setEditingId(null)} className="text-red-600 hover:bg-red-100 p-1 rounded"><X size={18} /></button>
                            </div>
                        </td>
                     </tr>
                  ) : (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-700 font-medium">{item.name}</td>
                        <td className="px-6 py-4 text-slate-700">{item.uom || '-'}</td>
                        <td className="px-6 py-4 text-slate-700">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {item.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{item.description || '-'}</td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button onClick={() => startEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={16} /></button>
                            </div>
                        </td>
                    </tr>
                  )
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-white">
          <div className="text-sm text-slate-500">
            Showing <span className="font-medium">{(page - 1) * limit + (data.length > 0 ? 1 : 0)}</span> to <span className="font-medium">{Math.min(page * limit, total)}</span> of <span className="font-medium">{total}</span> results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-slate-600 px-2">Page {page} of {totalPages || 1}</span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-1 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default QualityParametersView;
