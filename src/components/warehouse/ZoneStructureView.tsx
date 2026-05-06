import React, { useState, useEffect } from 'react';
import { warehouseService } from '@/services/warehouseService';
import { Warehouse, Zone, Rack } from '@/types';
import { Layers, Plus, ChevronRight, Trash2, MapPin, Grid, Loader2 } from 'lucide-react';

const ZoneStructureView: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWh, setSelectedWh] = useState<string>('');
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [racks, setRacks] = useState<Rack[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [newZone, setNewZone] = useState({ name: '', code: '', type: 'General' });
  const [showRackForm, setShowRackForm] = useState(false);
  const [newRack, setNewRack] = useState({ name: '', code: '', levels: 4 });

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    if (selectedWh) loadZones(selectedWh);
  }, [selectedWh]);

  useEffect(() => {
    if (selectedZone) loadRacks(selectedZone);
  }, [selectedZone]);

  const loadWarehouses = async () => {
    setLoading(true);
    const data = await warehouseService.getAllWarehouses();
    setWarehouses(data);
    if(data.length > 0) setSelectedWh(data[0].id);
    setLoading(false);
  };

  const loadZones = async (whId: string) => {
    const data = await warehouseService.getZones(whId);
    setZones(data);
    setRacks([]);
    setSelectedZone('');
  };

  const loadRacks = async (zId: string) => {
    const data = await warehouseService.getRacks(selectedWh, zId);
    setRacks(data);
  };

  const handleAddZone = async () => {
    if (!newZone.name || !newZone.code) return;
    await warehouseService.saveZone({ ...newZone, warehouseId: selectedWh, type: newZone.type as any });
    setShowZoneForm(false);
    setNewZone({ name: '', code: '', type: 'General' });
    loadZones(selectedWh);
  };

  const handleAddRack = async () => {
    if (!newRack.name || !newRack.code) return;
    await warehouseService.saveRack({ ...newRack, zoneId: selectedZone, warehouseId: selectedWh });
    setShowRackForm(false);
    setNewRack({ name: '', code: '', levels: 4 });
    loadRacks(selectedZone);
  };

  const deleteZone = async (id: string) => {
    if(confirm('Delete zone?')) {
        await warehouseService.deleteZone(id);
        loadZones(selectedWh);
    }
  };

  const deleteRack = async (id: string) => {
    if(confirm('Delete rack?')) {
        await warehouseService.deleteRack(id);
        loadRacks(selectedZone);
    }
  };

  if(loading) return <div className="text-center py-8"><Loader2 className="animate-spin inline"/></div>;

  return (
    <div className="space-y-6">
        <div className="flex gap-4 items-center">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Layers className="text-blue-600" size={20}/> Storage Hierarchy
            </h2>
            <select 
                className="border rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 bg-white shadow-sm"
                value={selectedWh}
                onChange={e => setSelectedWh(e.target.value)}
            >
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[600px]">
            {/* Zones Column */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">Zones</h3>
                    <button onClick={() => setShowZoneForm(true)} className="text-blue-600 hover:bg-blue-100 p-1 rounded"><Plus size={18}/></button>
                </div>
                
                {showZoneForm && (
                    <div className="p-4 bg-blue-50 border-b space-y-3 animate-fade-in">
                        <input className="w-full border rounded p-2 text-sm" placeholder="Zone Name" value={newZone.name} onChange={e => setNewZone({...newZone, name: e.target.value})}/>
                        <div className="flex gap-2">
                            <input className="w-1/2 border rounded p-2 text-sm" placeholder="Code (e.g. ZA)" value={newZone.code} onChange={e => setNewZone({...newZone, code: e.target.value})}/>
                            <select className="w-1/2 border rounded p-2 text-sm" value={newZone.type} onChange={e => setNewZone({...newZone, type: e.target.value})}>
                                <option value="General">General</option>
                                <option value="Cold">Cold</option>
                                <option value="Hazmat">Hazmat</option>
                                <option value="Bulk">Bulk</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowZoneForm(false)} className="text-slate-500 text-xs hover:text-slate-700">Cancel</button>
                            <button onClick={handleAddZone} className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">Save</button>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {zones.length === 0 && <p className="text-center text-slate-400 py-4 text-sm">No zones defined.</p>}
                    {zones.map(z => (
                        <div 
                            key={z.id}
                            onClick={() => setSelectedZone(z.id)}
                            className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center group transition-colors ${selectedZone === z.id ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-200' : 'hover:bg-slate-50 border-slate-200'}`}
                        >
                            <div className="flex items-center gap-3">
                                <MapPin size={16} className="text-slate-400"/>
                                <div>
                                    <p className="font-medium text-sm text-slate-800">{z.name}</p>
                                    <p className="text-xs text-slate-500 font-mono">{z.code} • {z.type}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => {e.stopPropagation(); deleteZone(z.id);}} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                <ChevronRight size={16} className="text-slate-400"/>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Racks Column */}
            <div className={`bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden ${!selectedZone ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">Racks & Shelves</h3>
                    <button onClick={() => setShowRackForm(true)} className="text-purple-600 hover:bg-purple-100 p-1 rounded"><Plus size={18}/></button>
                </div>

                {showRackForm && (
                    <div className="p-4 bg-purple-50 border-b space-y-3 animate-fade-in">
                        <input className="w-full border rounded p-2 text-sm" placeholder="Rack Name" value={newRack.name} onChange={e => setNewRack({...newRack, name: e.target.value})}/>
                        <div className="flex gap-2">
                            <input className="w-1/2 border rounded p-2 text-sm" placeholder="Code (e.g. R01)" value={newRack.code} onChange={e => setNewRack({...newRack, code: e.target.value})}/>
                            <input className="w-1/2 border rounded p-2 text-sm" type="number" placeholder="Levels" value={newRack.levels} onChange={e => setNewRack({...newRack, levels: Number(e.target.value)})}/>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowRackForm(false)} className="text-slate-500 text-xs hover:text-slate-700">Cancel</button>
                            <button onClick={handleAddRack} className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700">Save</button>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 content-start">
                    {selectedZone && racks.length === 0 && <p className="col-span-2 text-center text-slate-400 py-4 text-sm">No racks in this zone.</p>}
                    {!selectedZone && <p className="col-span-2 text-center text-slate-400 py-4 text-sm">Select a zone to manage racks.</p>}
                    
                    {racks.map(r => (
                        <div key={r.id} className="border border-slate-200 rounded-lg p-3 hover:shadow-sm bg-slate-50 relative group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <Grid size={16} className="text-slate-400"/>
                                    <span className="font-bold text-slate-700 text-sm">{r.name}</span>
                                </div>
                                <span className="text-[10px] bg-white border px-1.5 rounded font-mono text-slate-500">{r.code}</span>
                            </div>
                            
                            {/* Visual Shelves */}
                            <div className="space-y-1">
                                {Array.from({length: r.levels}).map((_, i) => (
                                    <div key={i} className="h-2 bg-slate-300 rounded-full w-full"></div>
                                ))}
                            </div>
                            <p className="text-xs text-center text-slate-400 mt-2">{r.levels} Shelves</p>

                            <button 
                                onClick={() => deleteRack(r.id)} 
                                className="absolute top-2 right-2 p-1 bg-white rounded shadow-sm text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={12}/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default ZoneStructureView;
