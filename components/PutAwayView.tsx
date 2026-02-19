import React, { useState, useEffect } from 'react';
import { procurementService } from '../services/procurementService';
import { PutAwayTask } from '../types';
import { Package, ArrowRight, MapPin, CheckCircle, Loader2 } from 'lucide-react';

const PutAwayView: React.FC = () => {
  const [tasks, setTasks] = useState<PutAwayTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  
  // Simple inline form state
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [location, setLocation] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const allTasks = await procurementService.getPutAwayTasks();
    setTasks(allTasks.filter(t => t.status === 'Pending'));
    setLoading(false);
  };

  const handleComplete = async (id: string) => {
    if (!location) return alert("Please specify a bin location");
    setCompletingId(id);
    try {
        await procurementService.completePutAway(id, location);
        alert("Put Away Completed. Stock Available!");
        setSelectedTask(null);
        setLocation('');
        loadData();
    } catch (e) {
        console.error(e);
        alert("Failed to complete task");
    } finally {
        setCompletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Package className="text-blue-600" size={20}/> Put-Away Tasks
        </h2>
        <p className="text-sm text-slate-500 mb-6">Assign storage locations to QC-approved items to make them available in inventory.</p>

        {loading ? (
            <div className="text-center py-8"><Loader2 className="animate-spin inline"/> Loading tasks...</div>
        ) : tasks.length === 0 ? (
            <div className="bg-green-50 text-green-700 p-6 rounded-lg text-center">
                All cleared! No items pending for put-away.
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.map(task => (
                    <div key={task.id} className="border border-slate-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                {task.grnNumber}
                            </span>
                            <span className="text-xs text-slate-400">Qty: {task.quantity}</span>
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-1">{task.itemName}</h3>
                        <p className="text-xs text-slate-500 mb-4">Item ID: {task.itemId}</p>
                        
                        {selectedTask === task.id ? (
                            <div className="animate-fade-in space-y-2">
                                <div className="relative">
                                    <MapPin className="absolute left-2 top-2 text-slate-400" size={14}/>
                                    <input 
                                        type="text" 
                                        autoFocus
                                        placeholder="Enter Bin/Rack (e.g. A-12)"
                                        className="w-full pl-7 pr-2 py-1.5 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-200 focus:outline-none"
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleComplete(task.id)}
                                        disabled={completingId === task.id}
                                        className="flex-1 bg-green-600 text-white text-xs py-1.5 rounded hover:bg-green-700 flex justify-center items-center gap-1"
                                    >
                                        {completingId === task.id ? <Loader2 size={12} className="animate-spin"/> : <CheckCircle size={12}/>}
                                        Confirm
                                    </button>
                                    <button 
                                        onClick={() => setSelectedTask(null)}
                                        className="px-2 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 rounded"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button 
                                onClick={() => { setSelectedTask(task.id); setLocation(''); }}
                                className="w-full bg-blue-50 text-blue-600 text-sm py-2 rounded hover:bg-blue-100 flex items-center justify-center gap-2 font-medium"
                            >
                                Assign Location <ArrowRight size={14}/>
                            </button>
                        )}
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default PutAwayView;
