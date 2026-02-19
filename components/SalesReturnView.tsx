import React, { useState, useEffect } from 'react';
import { salesService } from '../services/salesService';
import { SalesReturn, SalesOrder, ReturnItem } from '../types';
import { Undo2, Search, Loader2 } from 'lucide-react';

const SalesReturnView: React.FC = () => {
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [sos, setSOs] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSO, setSelectedSO] = useState<SalesOrder | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [retData, soData] = await Promise.all([
        salesService.getSalesReturns(),
        salesService.getAllSOs()
    ]);
    setReturns(retData);
    setSOs(soData);
    setLoading(false);
  };

  const handleCreateReturn = async () => {
    if(!selectedSO) return;
    
    // Mocking return items - assuming returning 1 of first item
    const returnItems: ReturnItem[] = [{
        itemId: selectedSO.items[0].itemId,
        itemName: selectedSO.items[0].itemName,
        quantity: 1,
        reason: 'Damaged in Transit'
    }];

    await salesService.createSalesReturn({
        soId: selectedSO.id,
        soNumber: selectedSO.soNumber,
        customerName: selectedSO.customerName,
        date: new Date().toISOString().split('T')[0],
        items: returnItems
    });
    
    alert("Return Processed");
    setSelectedSO(null);
    loadData();
  };

  const eligibleSOs = sos.filter(s => 
      s.status === 'Dispatched' && 
      (s.soNumber.toLowerCase().includes(searchTerm.toLowerCase()) || s.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
           <div className="flex justify-between items-center mb-6">
               <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   <Undo2 className="text-red-500" size={20}/> Sales Returns
               </h2>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {/* Create Return */}
               <div>
                   <h3 className="font-semibold text-slate-700 mb-3">Process New Return</h3>
                   <div className="relative mb-4">
                       <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                       <input 
                         type="text" 
                         placeholder="Search Dispatched Orders..." 
                         className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm"
                         value={searchTerm}
                         onChange={e => setSearchTerm(e.target.value)}
                       />
                   </div>
                   
                   <div className="border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
                       {eligibleSOs.map(so => (
                           <div key={so.id} className="p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 flex justify-between items-center">
                               <div>
                                   <p className="font-medium text-sm text-slate-800">{so.soNumber}</p>
                                   <p className="text-xs text-slate-500">{so.customerName}</p>
                               </div>
                               <button 
                                 onClick={() => setSelectedSO(so)}
                                 className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100"
                               >
                                   Select
                               </button>
                           </div>
                       ))}
                   </div>

                   {selectedSO && (
                       <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200 animate-fade-in">
                           <p className="font-semibold text-sm mb-2">Returning for: {selectedSO.soNumber}</p>
                           <p className="text-xs text-slate-500 mb-4">Mocking return of 1 item...</p>
                           <button 
                             onClick={handleCreateReturn}
                             className="w-full bg-red-600 text-white py-2 rounded text-sm hover:bg-red-700"
                           >
                               Confirm Return
                           </button>
                       </div>
                   )}
               </div>

               {/* History */}
               <div>
                   <h3 className="font-semibold text-slate-700 mb-3">Return History</h3>
                   <div className="space-y-3">
                       {returns.map(ret => (
                           <div key={ret.id} className="border border-slate-200 rounded-lg p-3">
                               <div className="flex justify-between mb-1">
                                   <span className="font-bold text-sm text-slate-700">{ret.returnNumber}</span>
                                   <span className="text-xs text-slate-400">{ret.date}</span>
                               </div>
                               <p className="text-xs text-slate-600">Ref: {ret.soNumber}</p>
                               <div className="mt-2 text-xs bg-red-50 text-red-700 p-2 rounded">
                                   {ret.items[0].quantity}x {ret.items[0].itemName} ({ret.items[0].reason})
                               </div>
                           </div>
                       ))}
                       {returns.length === 0 && <p className="text-slate-400 text-sm">No returns recorded.</p>}
                   </div>
               </div>
           </div>
       </div>
    </div>
  );
};

export default SalesReturnView;
