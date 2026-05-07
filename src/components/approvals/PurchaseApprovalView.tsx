import React, { useState, useEffect } from 'react';
import { approvalService } from '@/services/approvalService';
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
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const PurchaseApprovalView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('requisitions');
  const [prs, setPRs] = useState<PurchaseRequisition[]>([]);
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

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
           {loading ? (
             <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-slate-50">
               <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
               <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Synchronizing Requisition Queue...</p>
             </div>
           ) : prs.length === 0 ? (
             <Card className="border-none shadow-sm bg-white rounded-[2.5rem] py-20 text-center">
                <CheckCircle2 className="mx-auto text-emerald-500 mb-6" size={64} />
                <h3 className="text-2xl font-black text-slate-800">Queue is Empty</h3>
                <p className="text-slate-400 font-medium mt-2">All purchase requisitions have been processed.</p>
             </Card>
           ) : (
             <div className="grid grid-cols-1 gap-6">
                {prs.map(pr => (
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
                             <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Clock size={12}/> Due: {pr.requiredDate}</p>
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
                                        <span className="text-[10px] font-bold text-slate-400 font-mono">${(item.estimatedPrice || 0) * item.quantity}</span>
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
                               {processingId === pr.id ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle2 size={18} />}
                               Approve Requisition
                             </Button>
                          </div>
                       </div>
                    </CardContent>
                  </Card>
                ))}
             </div>
           )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
           {loading ? (
             <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-slate-50">
               <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
             </div>
           ) : pos.length === 0 ? (
             <Card className="border-none shadow-sm bg-white rounded-[2.5rem] py-20 text-center">
                <CheckCircle2 className="mx-auto text-emerald-500 mb-6" size={64} />
                <h3 className="text-2xl font-black text-slate-800">All Orders Approved</h3>
             </Card>
           ) : (
             <div className="grid grid-cols-1 gap-6">
                {pos.map(po => (
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
                                    <DollarSign size={20} className="text-indigo-400" />
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
                                          <p className="text-[10px] font-bold text-slate-400 uppercase">Qty: {item.quantity} | Rate: ${item.unitPrice}</p>
                                        </div>
                                     </div>
                                     <div className="text-right">
                                        <p className="text-sm font-black text-slate-800 tabular-nums">${item.quantity * item.unitPrice}</p>
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
                               {processingId === po.id ? <Loader2 className="animate-spin" size={18}/> : <ArrowRight size={18} />}
                               Authorize & Dispatch PO
                             </Button>
                          </div>
                       </div>
                    </CardContent>
                  </Card>
                ))}
             </div>
           )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PurchaseApprovalView;
