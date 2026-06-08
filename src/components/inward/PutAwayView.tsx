import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchPutAwayTasks } from '@/store/slices/procurementSlice';
import { PutAwayTask, Bin } from '@/types';
import { warehouseService } from '@/services/warehouseService';
import { NotionSelect } from '@/components/common/NotionSelect';
import { procurementService } from '@/services/procurementService';
import { Package, ArrowRight, MapPin, CheckCircle, Loader2, Search, Info, AlertTriangle, Layers, XCircle, Tag } from 'lucide-react';

const PutAwayView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { putAwayTasks, loading, error } = useAppSelector((state) => state.procurement);
  const [completingId, setCompletingId] = useState<string | null>(null);
  
  // Simple inline form state
  const [selectedTask, setSelectedTask] = useState<PutAwayTask | null>(null);
  const [location, setLocation] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [bins, setBins] = useState<Bin[]>([]);
  const [loadingBins, setLoadingBins] = useState(false);

  useEffect(() => {
    dispatch(fetchPutAwayTasks());
  }, [dispatch]);

  const handleComplete = async (taskId: string) => {
    if (!location || !selectedTask) return alert("Please specify a warehouse bin location");
    setCompletingId(taskId);
    try {
        await procurementService.completePutAway(taskId, location, selectedTask.warehouseId || '');
        setSelectedTask(null);
        setLocation('');
        dispatch(fetchPutAwayTasks());
        alert("Put-Away completed successfully! Item is now available for inventory operations.");
    } catch (e) {
        console.error(e);
        alert("Failed to complete put-away task. Check server logs.");
    } finally {
        setCompletingId(null);
    }
  };

  const handleInitiate = async (task: PutAwayTask) => {
    setSelectedTask(task);
    setLocation('');
    setLoadingBins(true);
    try {
        const warehouseBins = await warehouseService.getAllBins({ warehouseId: task.warehouseId });
        setBins(warehouseBins);
    } catch (e) {
        console.error("Failed to fetch bins", e);
        setBins([]);
    } finally {
        setLoadingBins(false);
    }
  };

  const filteredTasks = putAwayTasks.filter(t => 
    t.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.grnNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory Put-Away</h1>
          <p className="text-sm text-slate-500">Move QC-passed stock to their designated storage bins.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
          <input 
            type="text" 
            placeholder="Search by Item or GRN..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stats / Info Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-blue-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Layers size={24} />
            </div>
            <div>
                <p className="text-blue-100 text-[10px] font-bold uppercase tracking-wider">Pending Tasks</p>
                <p className="text-2xl font-black">{putAwayTasks.length}</p>
            </div>
         </div>
         <div className="md:col-span-2 bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
            <AlertTriangle className="text-amber-500 shrink-0" size={20}/>
            <p className="text-xs text-amber-700 font-medium">
                <span className="font-bold">Pro Tip:</span> Always verify the bin capacity before confirming put-away. Incorrect placement can lead to picking inefficiencies.
            </p>
         </div>
      </div>

      {/* Tasks Grid */}
      {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
             <Loader2 className="animate-spin-slow text-blue-600 mb-4" size={40}/>
             <p className="text-slate-500 font-bold">Synchronizing put-away queue...</p>
          </div>
      ) : filteredTasks.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="text-emerald-500" size={40}/>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">No Tasks Pending</h3>
              <p className="text-slate-500 max-w-sm mx-auto">All inward shipments have been successfully stored and indexed in the warehouse.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTasks.map(task => (
                  <div key={task.id} className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300">
                      <div className="p-5">
                          <div className="flex justify-between items-start mb-4">
                              <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-md uppercase tracking-tighter">
                                  Ref: {task.grnNumber}
                              </span>
                              <div className="flex flex-col items-end">
                                <span className="text-xs font-black text-slate-700">{task.quantity} Units</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pending</span>
                              </div>
                          </div>
                          
                          <div className="mb-4">
                            <h3 className="font-black text-slate-800 text-lg leading-tight mb-1 line-clamp-1">{task.itemName}</h3>
                            <div className="flex flex-wrap items-center gap-3 text-slate-400 mt-2">
                                <div className="flex items-center gap-1.5">
                                    <Info size={12}/>
                                    <span className="text-[10px] font-bold font-mono tracking-tighter">SKU: {task.itemId}</span>
                                </div>
                                {task.hsnCode && (
                                    <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                        <Tag size={10} className="text-blue-400"/>
                                        <span className="text-[9px] font-black text-slate-500 uppercase">HSN: {task.hsnCode} ({task.taxRate}%)</span>
                                    </div>
                                )}
                            </div>
                          </div>
                          
                           {selectedTask?.id === task.id ? (
                              <div className="animate-fade-in-up space-y-3 mt-4 pt-4 border-t border-slate-50">
                                  <div className="space-y-1.5">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Storage Bin</label>
                                      {loadingBins ? (
                                          <div className="h-10 flex items-center justify-center bg-slate-50 rounded-xl border-2 border-slate-100">
                                              <Loader2 size={16} className="animate-spin-slow text-blue-500 mr-2"/>
                                              <span className="text-xs text-slate-400 font-bold">Loading available bins...</span>
                                          </div>
                                      ) : (
                                          <NotionSelect 
                                              value={location}
                                              onValueChange={setLocation}
                                              placeholder="Search Bin (e.g. WH-A1-S2)"
                                              options={bins.map(b => ({
                                                  label: `${b.binCode} (${b.status})`,
                                                  value: b.id
                                              }))}
                                          />
                                      )}
                                  </div>
                                  <div className="flex gap-2">
                                      <button 
                                          onClick={() => handleComplete(task.id)}
                                          disabled={completingId === task.id || !location}
                                          className="flex-1 bg-emerald-600 text-white text-xs font-black py-2.5 rounded-xl hover:bg-emerald-700 disabled:bg-slate-200 disabled:shadow-none flex justify-center items-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-95"
                                      >
                                          {completingId === task.id ? <Loader2 size={16} className="animate-spin-slow"/> : <CheckCircle size={16}/>}
                                          Confirm Placement
                                      </button>
                                      <button 
                                          onClick={() => setSelectedTask(null)}
                                          className="px-4 text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors rounded-xl"
                                      >
                                          Cancel
                                      </button>
                                  </div>
                              </div>
                          ) : (
                              <button 
                                  onClick={() => handleInitiate(task)}
                                  className="w-full mt-4 bg-slate-50 group-hover:bg-blue-600 text-slate-600 group-hover:text-white text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-black"
                              >
                                  Initiate Put-Away <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                              </button>
                          )}
                      </div>
                      
                      <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                             <MapPin size={10}/> Suggested: <span className="text-slate-600 italic">Zone A-Main</span>
                          </div>
                          <button className="text-blue-500 hover:underline text-[10px] font-black uppercase tracking-wider">History</button>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default PutAwayView;
