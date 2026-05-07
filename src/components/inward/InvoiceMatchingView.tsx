import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchInvoices, fetchPOs, fetchGRNs } from '@/store/slices/procurementSlice';
import { procurementService } from '@/services/procurementService';
import { PurchaseInvoice, PurchaseOrder, GRN } from '@/types';
import { 
  FileCheck, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  DollarSign, 
  FileText, 
  Truck, 
  ShieldCheck,
  Plus,
  Loader2,
  XCircle,
  Divide
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const InvoiceMatchingView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { invoices, pos, grns, loading, error } = useAppSelector((state) => state.procurement);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [selectedGRN, setSelectedGRN] = useState<GRN | null>(null);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);

  useEffect(() => {
    dispatch(fetchInvoices());
    dispatch(fetchPOs());
    dispatch(fetchGRNs());
  }, [dispatch]);

  const handlePOSelect = (poId: string) => {
    const po = pos.find(p => p.id === poId);
    setSelectedPO(po || null);
    setSelectedGRN(null);
  };

  const handleGRNSelect = (grnId: string) => {
    const grn = grns.find(g => g.id === grnId);
    if (!grn || !selectedPO) return;
    
    setSelectedGRN(grn);
    
    // Auto-populate invoice items for matching
    const items = grn.items.map(gi => {
      const poItem = selectedPO.items.find(pi => pi.itemId === gi.itemId);
      return {
        itemId: gi.itemId,
        itemName: gi.itemName,
        poQty: poItem?.quantity || 0,
        grnQty: gi.acceptedQty,
        invoiceQty: gi.acceptedQty, // Default to accepted qty
        unitPrice: poItem?.unitPrice || 0,
        variance: 0
      };
    });
    setInvoiceItems(items);
  };

  const updateInvoiceQty = (index: number, val: number) => {
    const updated = [...invoiceItems];
    updated[index].invoiceQty = val;
    updated[index].variance = val - updated[index].grnQty;
    setInvoiceItems(updated);
  };

  const handleSubmit = async () => {
    if (!selectedPO || !selectedGRN || !invoiceNo) return alert("Fill all fields");
    
    try {
      await procurementService.createPurchaseInvoice({
        invoiceNumber: invoiceNo,
        vendorId: selectedPO.vendorId,
        vendorName: selectedPO.vendorName,
        poId: selectedPO.id,
        poNumber: selectedPO.poNumber,
        grnId: selectedGRN.id,
        grnNumber: selectedGRN.grnNumber,
        date: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        items: invoiceItems,
        totalAmount: invoiceItems.reduce((acc, i) => acc + (i.invoiceQty * i.unitPrice), 0)
      });
      setShowCreateModal(false);
      dispatch(fetchInvoices());
      alert("Invoice Matched and Recorded successfully.");
    } catch (e) {
      console.error(e);
      alert("Failed to record invoice.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-emerald-600 rounded-3xl text-white shadow-xl shadow-emerald-100">
            <FileCheck size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">3-Way Invoice Match</h1>
            <p className="text-slate-500 font-medium mt-1">Verify Supplier Invoice vs. Purchase Order vs. Goods Receipt.</p>
          </div>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-7 rounded-2xl shadow-xl shadow-emerald-100 flex items-center gap-3 text-base font-bold transition-all active:scale-95"
        >
          <Plus size={20} /> Register Invoice
        </Button>
      </div>

      {/* Matching Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Awaiting Verification</p>
                <p className="text-4xl font-black text-slate-800 mt-2">{grns.filter(g => g.status === 'QC Completed').length}</p>
                <p className="text-xs text-slate-500 mt-2 font-medium">Shipments ready for financial matching</p>
              </div>
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Truck size={28} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Matched Value</p>
                <p className="text-4xl font-black text-emerald-600 mt-2">
                  ${invoices.filter(i => i.status === 'Matched').reduce((acc, i) => acc + i.totalAmount, 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 mt-2 font-medium">Successfully reconciled purchase value</p>
              </div>
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                <ShieldCheck size={28} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden group">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Discrepancies</p>
                <p className="text-4xl font-black text-red-600 mt-2">{invoices.filter(i => i.status === 'Discrepancy').length}</p>
                <p className="text-xs text-slate-500 mt-2 font-medium">Requiring manual vendor reconciliation</p>
              </div>
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl group-hover:scale-110 transition-transform">
                <AlertTriangle size={28} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reconciled Ledger */}
      <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-black text-slate-800 uppercase tracking-widest">Financial Reconciliation Ledger</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter by Invoice or PO..." 
              className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs focus:ring-4 focus:ring-emerald-500/10 outline-none font-bold"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                <tr>
                  <th className="px-8 py-6">Matching Doc</th>
                  <th className="px-8 py-6">Order & Receipt Ref</th>
                  <th className="px-8 py-6">Vendor Details</th>
                  <th className="px-8 py-6">Financial Impact</th>
                  <th className="px-8 py-6">Lifecycle Status</th>
                  <th className="px-8 py-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-8 py-7">
                      <div className="font-mono font-black text-emerald-600 text-base">{inv.invoiceNumber}</div>
                      <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{inv.date}</div>
                    </td>
                    <td className="px-8 py-7">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-[9px] font-black px-2">PO: {inv.poNumber}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[9px] font-black px-2">GRN: {inv.grnNumber}</Badge>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-7">
                      <p className="text-sm font-black text-slate-800">{inv.vendorName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Certified Supplier</p>
                    </td>
                    <td className="px-8 py-7">
                      <div className="flex items-center gap-1.5 text-slate-800 font-black text-base tabular-nums">
                        <DollarSign size={16} className="text-slate-400" />
                        {inv.totalAmount.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Matched Value</div>
                    </td>
                    <td className="px-8 py-7">
                      <Badge className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                        inv.status === 'Matched' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        inv.status === 'Discrepancy' ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="px-8 py-7 text-right">
                       <Button variant="ghost" size="sm" className="rounded-xl group-hover:translate-x-1 transition-transform">
                         <ArrowRight size={18} className="text-slate-300" />
                       </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Register Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex h-[750px]">
              {/* Left Panel */}
              <div className="w-[35%] bg-emerald-900 p-12 text-white flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mb-8 border border-white/10 shadow-inner">
                    <FileCheck className="text-emerald-400" size={32} />
                  </div>
                  <h2 className="text-4xl font-black leading-tight">3-Way Match Verification</h2>
                  <p className="text-emerald-100/60 mt-6 text-base leading-relaxed font-medium">
                    Financial verification system. We compare the <span className="text-emerald-300">Purchase Order</span> against the <span className="text-emerald-300">Goods Receipt Note</span> to validate the <span className="text-emerald-300">Supplier Invoice</span>.
                  </p>
                </div>
                
                <div className="space-y-8 bg-black/10 p-6 rounded-[2rem] border border-white/5 shadow-inner">
                  <div className="flex items-center gap-5">
                    <div className={`w-3 h-3 rounded-full ${selectedPO ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-white/20'}`} />
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-100">Step 1: Order Validation</p>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className={`w-3 h-3 rounded-full ${selectedGRN ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-white/20'}`} />
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-100">Step 2: Receipt Linkage</p>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className={`w-3 h-3 rounded-full ${invoiceNo ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-white/20'}`} />
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-100">Step 3: Financial Mapping</p>
                  </div>
                </div>
              </div>

              {/* Right Panel - Form */}
              <div className="flex-1 flex flex-col bg-white">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Procurement Lifecycle Verification</span>
                  <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <XCircle size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                   {/* Step 1: Selection */}
                   <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">1. Purchase Order Reference *</label>
                        <select 
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none"
                          onChange={e => handlePOSelect(e.target.value)}
                          value={selectedPO?.id || ''}
                        >
                          <option value="">Select PO...</option>
                          {pos.filter(p => p.status !== 'Draft').map(po => (
                            <option key={po.id} value={po.id}>{po.poNumber} — {po.vendorName}</option>
                          ))}
                        </select>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">2. Linked GRN Identifier *</label>
                        <select 
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none disabled:opacity-30"
                          disabled={!selectedPO}
                          onChange={e => handleGRNSelect(e.target.value)}
                          value={selectedGRN?.id || ''}
                        >
                          <option value="">Select GRN...</option>
                          {grns.filter(g => g.poId === selectedPO?.id).map(grn => (
                            <option key={grn.id} value={grn.id}>{grn.grnNumber} ({grn.items.length} items)</option>
                          ))}
                        </select>
                     </div>
                   </div>

                   {/* Step 2: Invoice Info */}
                   <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">3. Supplier Invoice Number *</label>
                        <div className="relative">
                          <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                          <input 
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                            placeholder="EX: INV-2024-VEND-001"
                            value={invoiceNo}
                            onChange={e => setInvoiceNo(e.target.value)}
                          />
                        </div>
                      </div>
                   </div>

                   {/* Step 3: Comparison Matrix */}
                   {selectedGRN && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-white">
                           <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Matching Matrix</h4>
                           <span className="text-[9px] font-bold text-slate-400 uppercase">Quantities & Discrepancies</span>
                        </div>
                        
                        <div className="space-y-4">
                           {invoiceItems.map((item, idx) => (
                             <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-6">
                                  <div>
                                    <p className="text-base font-black text-slate-800 leading-tight">{item.itemName}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Price: ${item.unitPrice} / unit</p>
                                  </div>
                                  <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${item.variance === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    {item.variance === 0 ? 'Perfect Match' : `${item.variance > 0 ? '+' : ''}${item.variance} Variance`}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-6">
                                   <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-50 text-center">
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">PO Qty</p>
                                      <p className="text-base font-black text-slate-700">{item.poQty}</p>
                                   </div>
                                   <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-50 text-center">
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">GRN Qty</p>
                                      <p className="text-base font-black text-slate-700">{item.grnQty}</p>
                                   </div>
                                   <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100 text-center">
                                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Invoice Qty</p>
                                      <input 
                                        type="number" 
                                        className="w-full bg-white border-2 border-emerald-100 rounded-xl p-1 text-center text-sm font-black text-emerald-700 outline-none"
                                        value={item.invoiceQty}
                                        onChange={e => updateInvoiceQty(idx, Number(e.target.value))}
                                      />
                                   </div>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                </div>

                <div className="p-10 border-t border-slate-50 flex gap-4 bg-slate-50/30">
                  <Button 
                    variant="ghost" 
                    className="flex-1 rounded-[1.5rem] py-8 font-bold text-slate-500 h-auto text-base hover:bg-white transition-all"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Discard Changes
                  </Button>
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.5rem] py-8 font-black shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 h-auto text-base active:scale-95 transition-all"
                    disabled={!selectedGRN || !invoiceNo}
                    onClick={handleSubmit}
                  >
                    <CheckCircle2 size={24} /> Confirm Match & Submit
                  </Button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceMatchingView;
