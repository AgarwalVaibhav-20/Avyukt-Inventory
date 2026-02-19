import React, { useState, useEffect } from 'react';
import { salesService } from '../services/salesService';
import { PickList, PackList, DeliveryChallan, DispatchNote, SalesOrder } from '../types';
import { ArrowRight, Box, FileCheck, Truck, CheckCircle2, Loader2, ListChecks } from 'lucide-react';

interface OutwardOpsViewProps {
  stage: 'pick' | 'pack' | 'challan' | 'dispatch';
}

const OutwardOpsView: React.FC<OutwardOpsViewProps> = ({ stage }) => {
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [sos, setSOs] = useState<SalesOrder[]>([]);
  const [pickLists, setPickLists] = useState<PickList[]>([]);
  const [packLists, setPackLists] = useState<PackList[]>([]);
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [dispatches, setDispatches] = useState<DispatchNote[]>([]);

  // Action State
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [stage]);

  const loadData = async () => {
    setLoading(true);
    // Load all context data for simplicity, in real app load specifically
    const [soD, pickD, packD, challanD, dispD] = await Promise.all([
        salesService.getAllSOs(),
        salesService.getPickLists(),
        salesService.getPackLists(),
        salesService.getChallans(),
        salesService.getDispatchNotes()
    ]);
    
    setSOs(soD);
    setPickLists(pickD);
    setPackLists(packD);
    setChallans(challanD);
    setDispatches(dispD);
    setLoading(false);
  };

  const handleAction = async (action: string, id: string, extraData?: any) => {
    setProcessingId(id);
    try {
        if(action === 'createPick') {
            await salesService.createPickList(id);
        } else if(action === 'confirmPick') {
            await salesService.completePickList(id);
        } else if(action === 'createPack') {
            await salesService.createPackList(id, extraData || 1);
        } else if(action === 'createChallan') {
            await salesService.createChallan(id);
        } else if(action === 'createDispatch') {
            await salesService.createDispatch(id, { transporter: 'DHL', vehicleNo: 'MH-12-3456', trackingId: 'TRK99' });
        }
        alert("Processed Successfully!");
        loadData();
    } catch (e) {
        console.error(e);
        alert("Operation Failed");
    } finally {
        setProcessingId(null);
    }
  };

  const renderContent = () => {
      if (stage === 'pick') {
          // Show SOs pending Pick AND Active Pick Lists
          const pendingSOs = sos.filter(s => s.status === 'Confirmed');
          
          return (
              <div className="space-y-6">
                  {/* Pending SOs */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <ListChecks size={20} className="text-blue-600"/> Orders Ready for Picking
                      </h3>
                      {pendingSOs.length === 0 ? <p className="text-slate-500 text-sm">No confirmed orders waiting.</p> : (
                          <div className="space-y-3">
                              {pendingSOs.map(so => (
                                  <div key={so.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                      <div>
                                          <p className="font-semibold text-slate-700">{so.soNumber}</p>
                                          <p className="text-xs text-slate-500">{so.customerName} • {so.items.length} Items</p>
                                      </div>
                                      <button 
                                        onClick={() => handleAction('createPick', so.id)}
                                        disabled={!!processingId}
                                        className="bg-blue-600 text-white text-xs px-3 py-2 rounded hover:bg-blue-700 flex items-center gap-1"
                                      >
                                        Generate Pick List <ArrowRight size={12}/>
                                      </button>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  {/* Active Pick Lists */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                      <h3 className="font-bold text-slate-800 mb-4">Active Pick Lists</h3>
                      <div className="space-y-3">
                          {pickLists.filter(p => p.status === 'Pending').map(pl => (
                              <div key={pl.id} className="p-4 border border-slate-200 rounded-lg">
                                  <div className="flex justify-between mb-2">
                                      <span className="font-bold">{pl.pickNumber}</span>
                                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">Picking in Progress</span>
                                  </div>
                                  <div className="text-xs text-slate-600 mb-3 space-y-1">
                                      {pl.items.map((i, idx) => (
                                          <div key={idx}>• {i.quantity}x {i.itemName} <span className="text-slate-400">({i.location})</span></div>
                                      ))}
                                  </div>
                                  <button 
                                    onClick={() => handleAction('confirmPick', pl.id)}
                                    disabled={!!processingId}
                                    className="w-full bg-green-600 text-white text-sm py-2 rounded hover:bg-green-700"
                                  >
                                      Mark as Picked
                                  </button>
                              </div>
                          ))}
                          {pickLists.filter(p => p.status === 'Pending').length === 0 && <p className="text-slate-500 text-sm">No active picks.</p>}
                      </div>
                  </div>
              </div>
          );
      }

      if (stage === 'pack') {
          const readyToPack = pickLists.filter(p => p.status === 'Picked' && !packLists.some(pl => pl.soId === p.soId)); // Simplistic check
          return (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Box size={20} className="text-amber-600"/> Packing Station
                  </h3>
                  {readyToPack.length === 0 ? <p className="text-slate-500 text-sm">No picked orders ready for packing.</p> : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {readyToPack.map(pl => (
                              <div key={pl.id} className="p-4 border border-slate-200 rounded-lg">
                                  <div className="flex justify-between mb-4">
                                      <span className="font-bold text-slate-700">{pl.soNumber}</span>
                                      <span className="text-xs text-green-600 font-medium">Picked & Ready</span>
                                  </div>
                                  <button 
                                    onClick={() => handleAction('createPack', pl.id, 2)} // Mocking 2 boxes
                                    disabled={!!processingId}
                                    className="w-full bg-amber-500 text-white text-sm py-2 rounded hover:bg-amber-600 flex justify-center items-center gap-2"
                                  >
                                      {processingId === pl.id ? <Loader2 className="animate-spin" size={16}/> : <Box size={16}/>}
                                      Pack Items
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          );
      }

      if (stage === 'challan') {
          const readyForChallan = packLists.filter(p => p.status === 'Packed' && !challans.some(c => c.soId === p.soId));
          return (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <FileCheck size={20} className="text-blue-600"/> Generate Delivery Challan
                  </h3>
                   {readyForChallan.length === 0 ? <p className="text-slate-500 text-sm">No packed orders pending challan.</p> : (
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                              <tr>
                                  <th className="p-3">Pack List</th>
                                  <th className="p-3">SO Ref</th>
                                  <th className="p-3">Boxes</th>
                                  <th className="p-3 text-right">Action</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {readyForChallan.map(pl => (
                                  <tr key={pl.id}>
                                      <td className="p-3 font-medium">{pl.packNumber}</td>
                                      <td className="p-3">{pl.soNumber}</td>
                                      <td className="p-3">{pl.boxCount}</td>
                                      <td className="p-3 text-right">
                                          <button 
                                            onClick={() => handleAction('createChallan', pl.id)}
                                            disabled={!!processingId}
                                            className="text-blue-600 hover:underline font-medium"
                                          >
                                              Generate DC
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                   )}
              </div>
          );
      }

      if (stage === 'dispatch') {
          const readyToShip = challans.filter(c => c.status === 'Generated');
          return (
             <div className="space-y-6">
                 {/* Pending Dispatch */}
                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Truck size={20} className="text-purple-600"/> Dispatch Hub
                    </h3>
                    {readyToShip.length === 0 ? <p className="text-slate-500 text-sm">No pending shipments.</p> : (
                         <div className="space-y-4">
                             {readyToShip.map(c => (
                                 <div key={c.id} className="flex justify-between items-center p-4 border border-slate-200 rounded-lg bg-slate-50">
                                     <div>
                                         <p className="font-bold text-slate-800">{c.challanNumber}</p>
                                         <p className="text-xs text-slate-500">Customer: {c.customerName}</p>
                                     </div>
                                     <button 
                                        onClick={() => handleAction('createDispatch', c.id)}
                                        disabled={!!processingId}
                                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm font-medium"
                                     >
                                         Dispatch Shipment
                                     </button>
                                 </div>
                             ))}
                         </div>
                    )}
                 </div>

                 {/* History */}
                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                     <h3 className="font-bold text-slate-800 mb-4">Recent Dispatches</h3>
                     <div className="space-y-2">
                         {dispatches.map(d => (
                             <div key={d.id} className="text-sm flex justify-between border-b border-slate-100 pb-2 last:border-0">
                                 <div>
                                     <span className="font-medium text-slate-700">{d.dispatchNumber}</span>
                                     <span className="text-xs text-slate-400 mx-2">|</span>
                                     <span className="text-slate-500">Tracking: {d.trackingId}</span>
                                 </div>
                                 <div className="text-green-600 text-xs font-medium flex items-center gap-1">
                                     <CheckCircle2 size={10}/> Shipped
                                 </div>
                             </div>
                         ))}
                     </div>
                 </div>
             </div>
          );
      }
      return null;
  };

  return (
    <div className="animate-fade-in">
        {loading ? <div className="text-center py-8"><Loader2 className="animate-spin inline"/> Loading Workflow...</div> : renderContent()}
    </div>
  );
};

export default OutwardOpsView;
