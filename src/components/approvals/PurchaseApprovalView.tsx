import React, { useState, useEffect } from 'react';
import { approvalService } from '@/services/approvalService';
import { settingsService } from '@/services/settingsService';
import { PurchaseOrder, PurchaseRequisition } from '@/types';
import {
  ShieldCheck,
  ClipboardList,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  Search,
  Filter,
  ArrowRight,
  User,
  Clock,
  Building2,
  IndianRupee,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Pagination from '@/components/common/Pagination';
import { useListControls } from '@/hooks/useListControls';

const PurchaseApprovalView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('requisitions');
  const [prs, setPRs] = useState<PurchaseRequisition[]>([]);
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [prSearch, setPRSearch] = useState('');
  const [poSearch, setPOSearch] = useState('');
  const [prFilters, setPRFilters] = useState({ status: 'all', sortOrder: 'newest' });
  const [poFilters, setPOFilters] = useState({ status: 'all', sortOrder: 'newest' });
  const prDateFormat = settingsService.getPurchaseRequisitionDateFormat();
  const formatPrDate = (value?: string) =>
    value ? settingsService.formatDisplayDate(value, prDateFormat) : '';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const prData = await approvalService.getPendingPRs();
      const poData = await approvalService.getPendingPOs();
      setPRs(prData);
      setPOs(poData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePRAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      if (action === 'approve') await approvalService.approvePR(id);
      else await approvalService.rejectPR(id);
      await loadData();
    } catch (e) {
      alert("PR action failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handlePOAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      if (action === 'approve') await approvalService.approvePO(id);
      else await approvalService.rejectPO(id);
      await loadData();
    } catch (e) {
      alert("PO action failed");
    } finally {
      setProcessingId(null);
    }
  };

  const {
    filteredItems: filteredPRs,
    pagedItems: pagedPRs,
    page: prPage,
    totalItems: prTotalItems,
    totalPages: prTotalPages,
    setPage: setPRPage,
  } = useListControls({
    items: prs,
    searchTerm: prSearch,
    filters: prFilters,
    initialPageSize: 4,
    searchFn: (pr, term) =>
      pr.prNumber.toLowerCase().includes(term) ||
      (pr.requestedBy || '').toLowerCase().includes(term) ||
      (pr.department || '').toLowerCase().includes(term) ||
      (pr.justification || '').toLowerCase().includes(term),
    filterFn: (pr, activeFilters) =>
      activeFilters.status === 'all' || (pr as any).status === activeFilters.status,
  });

  const {
    filteredItems: filteredPOs,
    pagedItems: pagedPOs,
    page: poPage,
    totalItems: poTotalItems,
    totalPages: poTotalPages,
    setPage: setPOPage,
  } = useListControls({
    items: pos,
    searchTerm: poSearch,
    filters: poFilters,
    initialPageSize: 4,
    searchFn: (po, term) =>
      po.poNumber.toLowerCase().includes(term) ||
      (po.vendorName || '').toLowerCase().includes(term) ||
      (po.status || '').toLowerCase().includes(term),
    filterFn: (po, activeFilters) =>
      activeFilters.status === 'all' || po.status === activeFilters.status,
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-100">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Approval Command Center</h1>
            <p className="text-slate-500 font-medium mt-1">Review and authorize procurement activities.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 px-4 py-2 rounded-xl text-xs font-black uppercase">
             {prs.length + pos.length} Tasks Pending
           </Badge>
        </div>
      </div>

      <Tabs defaultValue="requisitions" onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm h-auto gap-2 mb-8">
          <TabsTrigger 
            value="requisitions" 
            className="rounded-[1.5rem] px-8 py-4 data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-black text-sm transition-all"
          >
            <ClipboardList className="mr-2" size={18} />
            Requisitions ({prs.length})
          </TabsTrigger>
          <TabsTrigger 
            value="orders" 
            className="rounded-[1.5rem] px-8 py-4 data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-black text-sm transition-all"
          >
            <ShoppingBag className="mr-2" size={18} />
            Purchase Orders ({pos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requisitions" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-800">Purchase Requisitions</h2>
                <p className="text-sm text-slate-500">Search and filter pending requisitions.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={prSearch}
                    onChange={(e) => setPRSearch(e.target.value)}
                    placeholder="Search requisition, requester, department..."
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
                <div className="relative w-full sm:w-56">
                  <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={prFilters.status}
                    onChange={(e) => setPRFilters({ ...prFilters, status: e.target.value })}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/10"
                  >
                    <option value="all">All statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div className="relative w-full sm:w-44">
                  <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={prFilters.sortOrder}
                    onChange={(e) => setPRFilters({ ...prFilters, sortOrder: e.target.value })}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/10"
                  >
                    <option value="newest">Newest first</option>
                    <option value="earliest">Earliest first</option>
                  </select>
                </div>
              </div>
           </div>
           {loading ? (
             <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-slate-50">
               <Loader2 className="animate-spin-slow text-indigo-600 mb-4" size={48} />
               <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Synchronizing Requisition Queue...</p>
             </div>
           ) : filteredPRs.length === 0 ? (
             <Card className="border-none shadow-sm bg-white rounded-[2.5rem] py-20 text-center">
                <CheckCircle2 className="mx-auto text-emerald-500 mb-6" size={64} />
                <h3 className="text-2xl font-black text-slate-800">Queue is Empty</h3>
                <p className="text-slate-400 font-medium mt-2">All purchase requisitions have been processed.</p>
             </Card>
           ) : (
             <div className="grid grid-cols-1 gap-6">
                {pagedPRs.map(pr => (
                  <Card key={pr.id} className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden hover:ring-4 hover:ring-indigo-500/5 transition-all">
                    <CardContent className="p-0 flex flex-col md:flex-row h-full">
                       <div className="md:w-1/4 bg-slate-50 p-8 border-r border-slate-100 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-white px-3 py-1 rounded-lg shadow-sm border border-slate-100">PR Ref: {pr.prNumber}</span>
                            <div className="mt-6 space-y-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400">
                                    <User size={18} />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Requested By</p>
                                    <p className="text-sm font-black text-slate-800">{pr.requestedBy}</p>
                                  </div>
                               </div>
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400">
                                    <Building2 size={18} />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Department</p>
                                    <p className="text-sm font-black text-slate-800">{pr.department}</p>
                                  </div>
                               </div>
                            </div>
                          </div>
                          <div className="pt-6 border-t border-slate-200/50">
                             <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Clock size={12}/> Due: {formatPrDate(pr.requiredDate)}</p>
                          </div>
                       </div>
                       
                       <div className="flex-1 p-8 flex flex-col justify-between">
                          <div className="space-y-6">
                             <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Justification for Request</h4>
                                <p className="text-base text-slate-700 italic font-medium leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-dashed border-slate-200">
                                  "{pr.justification}"
                                </p>
                             </div>
                             
                             <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Requested Materials ({pr.items.length})</h4>
                                <div className="grid grid-cols-2 gap-3">
                                   {pr.items.map((item, idx) => (
                                     <div key={idx} className="flex items-center justify-between bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                        <div className="flex items-center gap-3">
                                           <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                              {item.quantity}
                                           </div>
                                           <span className="text-xs font-black text-slate-700">{item.itemName}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 font-mono">₹{(item.estimatedPrice || 0) * item.quantity}</span>
                                     </div>
                                   ))}
                                </div>
                             </div>
                          </div>

                          <div className="pt-8 flex justify-end gap-4">
                             <Button 
                                variant="ghost" 
                                className="rounded-2xl px-8 py-6 text-slate-400 hover:text-red-600 hover:bg-red-50 font-bold transition-all"
                                onClick={() => handlePRAction(pr.id, 'reject')}
                                disabled={processingId === pr.id}
                             >
                               <XCircle className="mr-2" size={18} /> Reject Request
                             </Button>
                             <Button 
                                className="rounded-2xl px-10 py-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-100 flex items-center gap-2 active:scale-95 transition-all"
                                onClick={() => handlePRAction(pr.id, 'approve')}
                                disabled={processingId === pr.id}
                             >
                               {processingId === pr.id ? <Loader2 className="animate-spin-slow" size={18}/> : <CheckCircle2 size={18} />}
                               Approve Requisition
                             </Button>
                          </div>
                       </div>
                    </CardContent>
                  </Card>
                ))}
             </div>
           )}
           {prTotalItems > 0 && prTotalPages > 1 && (
             <Pagination page={prPage} totalPages={prTotalPages} onPageChange={setPRPage} />
           )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-800">Purchase Orders</h2>
                <p className="text-sm text-slate-500">Search and filter approval queue.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={poSearch}
                    onChange={(e) => setPOSearch(e.target.value)}
                    placeholder="Search PO, vendor, status..."
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
                <div className="relative w-full sm:w-56">
                  <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={poFilters.status}
                    onChange={(e) => setPOFilters({ ...poFilters, status: e.target.value })}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/10"
                  >
                    <option value="all">All statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Pending">Pending</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div className="relative w-full sm:w-44">
                  <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={poFilters.sortOrder}
                    onChange={(e) => setPOFilters({ ...poFilters, sortOrder: e.target.value })}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition-all focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/10"
                  >
                    <option value="newest">Newest first</option>
                    <option value="earliest">Earliest first</option>
                  </select>
                </div>
              </div>
           </div>
           {loading ? (
             <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-slate-50">
               <Loader2 className="animate-spin-slow text-indigo-600 mb-4" size={48} />
             </div>
           ) : filteredPOs.length === 0 ? (
             <Card className="border-none shadow-sm bg-white rounded-[2.5rem] py-20 text-center">
                <CheckCircle2 className="mx-auto text-emerald-500 mb-6" size={64} />
                <h3 className="text-2xl font-black text-slate-800">All Orders Approved</h3>
             </Card>
           ) : (
             <div className="grid grid-cols-1 gap-6">
                {pagedPOs.map(po => (
                  <Card key={po.id} className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden hover:ring-4 hover:ring-indigo-500/5 transition-all">
                    <CardContent className="p-0 flex flex-col md:flex-row h-full">
                       <div className="md:w-1/4 bg-slate-900 p-8 text-white flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-lg border border-white/10">Order: {po.poNumber}</span>
                            <div className="mt-8 space-y-6">
                               <div>
                                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Vendor</p>
                                 <p className="text-xl font-black text-white mt-1 leading-tight">{po.vendorName}</p>
                               </div>
                               <div>
                                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Financial Commit</p>
                                 <div className="flex items-center gap-1.5 mt-1">
                                    <IndianRupee size={20} className="text-indigo-400" />
                                    <p className="text-2xl font-black text-white tabular-nums">{po.totalAmount.toLocaleString()}</p>
                                 </div>
                               </div>
                            </div>
                          </div>
                          <div className="pt-6 border-t border-white/5">
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Drafted On: {po.date}</p>
                          </div>
                       </div>
                       
                       <div className="flex-1 p-8 flex flex-col justify-between">
                          <div className="space-y-8">
                             <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Specification</h4>
                                <Badge variant="outline" className="rounded-lg bg-white font-black text-[9px] uppercase">{po.status}</Badge>
                             </div>
                             
                             <div className="space-y-4">
                                {po.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between group/item">
                                     <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover/item:bg-indigo-50 group-hover/item:text-indigo-600 transition-all">
                                           <FileText size={20}/>
                                        </div>
                                        <div>
                                          <p className="text-sm font-black text-slate-800">{item.itemName}</p>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase">Qty: {item.quantity} | Rate: ₹{item.unitPrice}</p>
                                        </div>
                                     </div>
                                     <div className="text-right">
                                        <p className="text-sm font-black text-slate-800 tabular-nums">₹{item.quantity * item.unitPrice}</p>
                                     </div>
                                  </div>
                                ))}
                             </div>
                          </div>

                          <div className="pt-10 flex justify-end gap-4">
                             <Button 
                                variant="ghost" 
                                className="rounded-2xl px-8 py-6 text-slate-400 hover:text-red-600 hover:bg-red-50 font-bold transition-all"
                                onClick={() => handlePOAction(po.id, 'reject')}
                                disabled={processingId === po.id}
                             >
                               Reject Order
                             </Button>
                             <Button 
                                className="rounded-2xl px-12 py-6 bg-slate-900 hover:bg-black text-white font-black shadow-xl shadow-slate-200 flex items-center gap-2 active:scale-95 transition-all"
                                onClick={() => handlePOAction(po.id, 'approve')}
                                disabled={processingId === po.id}
                             >
                               {processingId === po.id ? <Loader2 className="animate-spin-slow" size={18}/> : <ArrowRight size={18} />}
                               Authorize & Dispatch PO
                             </Button>
                          </div>
                       </div>
                    </CardContent>
                  </Card>
                ))}
             </div>
           )}
           {poTotalItems > 0 && poTotalPages > 1 && (
             <Pagination page={poPage} totalPages={poTotalPages} onPageChange={setPOPage} />
           )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PurchaseApprovalView;
