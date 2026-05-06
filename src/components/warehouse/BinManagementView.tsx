import React, { useState, useEffect } from 'react';
import { warehouseService } from '@/services/warehouseService';
import { Bin, Rack, Zone } from '@/types';
import { LayoutGrid, Plus, Trash2, Box, QrCode, Search, Loader2 } from 'lucide-react';
import { automationService } from '@/services/automationService';

const BinManagementView: React.FC = () => {
  const [bins, setBins] = useState<Bin[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Create Modal State
  const [isAdding, setIsAdding] = useState(false);
  const [newBin, setNewBin] = useState({ rackId: '', shelfLevel: 1, name: '', maxCapacity: 100 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
        const [bData, wData] = await Promise.all([
            warehouseService.getAllBins(),
            warehouseService.getAllWarehouses()
        ]);
        
        console.log("Loaded bins:", bData);
        console.log("Loaded warehouses:", wData);
        
        // Fetch all zones and racks for all warehouses to provide context
        // In a large app, we'd filter this, but for now we'll load them to resolve IDs
        const zonesPromises = wData.map(w => warehouseService.getZones(w.id));
        const zonesResults = await Promise.all(zonesPromises);
        const allZones = zonesResults.flat();

        console.log("Loaded zones:", allZones);

        // Fetch racks for each zone individually
        const racksPromises = allZones.map(z => {
            console.log("Fetching racks for warehouse:", z.warehouseId, "zone:", z.id);
            return warehouseService.getRacks(z.warehouseId as string, z.id);
        });
        const racksResults = await Promise.all(racksPromises);
        const allRacks = racksResults.flat();

        console.log("Loaded racks:", allRacks);

        setBins(bData);
        setZones(allZones);
        setRacks(allRacks);
    } catch (error) {
        console.error("Failed to load bin management data", error);
        alert(`Error loading bin management: ${(error as any)?.message}`);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
      if(!newBin.rackId || !newBin.name) return alert("Select Rack and Name");
      const rack = racks.find(r => r.id === newBin.rackId);
      const zone = zones.find(z => z.id === rack?.zoneId);
      if (!rack || !zone) {
          console.error("Rack not found:", newBin.rackId, "Available racks:", racks);
          return alert("Rack or zone data is missing. Please refresh and try again.");
      }
      
      const binNumber = Number(String(newBin.name).match(/\d+/)?.[0] || 1);

      try {
          const result = await warehouseService.saveBin({
              warehouseId: rack.warehouseId as string,
              zoneId: rack.zoneId as string,
              zone: (zone.code || 'A').replace(/^Z/i, ''),
              rackId: newBin.rackId,
              shelfId: undefined, 
              name: newBin.name,
              row: 1, 
              level: newBin.shelfLevel,
              number: binNumber, 
              capacity: newBin.maxCapacity,
              current: 0,
              status: 'Empty'
          } as any);
          console.log("Bin created successfully:", result);
          setIsAdding(false);
          setNewBin({ rackId: '', shelfLevel: 1, name: '', maxCapacity: 100 });
          loadData();
      } catch (error) {
          console.error("Failed to create bin:", error);
          alert(`Error creating bin: ${(error as any)?.message}`);
      }
  };

  const handleDelete = async (id: string) => {
      if(confirm("Delete this bin location?")) {
          await warehouseService.deleteBin(id);
          loadData();
      }
  };

  const getQrUrl = (code: string) => automationService.getQrCodeImageUrl(code);

  const filteredBins = bins.filter(b => 
      (b.binCode?.toLowerCase() || b.code?.toLowerCase() || "").includes(search.toLowerCase()) || 
      (b.name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <LayoutGrid className="text-indigo-600" size={20}/> Bin Location Manager
                </h2>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                        <input 
                            type="text" 
                            placeholder="Search Location Code..." 
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button onClick={() => setIsAdding(!isAdding)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium flex gap-2 items-center">
                        <Plus size={16}/> Add Bin
                    </button>
                </div>
            </div>

            {/* Setup Guide */}
            {zones.length === 0 || racks.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-amber-800 font-medium mb-2">⚠️ Setup Required</p>
                    <p className="text-xs text-amber-700">To create bins, you need to set up the warehouse hierarchy first:</p>
                    <ol className="text-xs text-amber-700 ml-4 mt-2 space-y-1">
                        <li>1. Create a Warehouse (Warehouse Master)</li>
                        <li>2. Create Zones within the Warehouse (Zone Structure)</li>
                        <li>3. Create Racks within Zones (Zone Structure)</li>
                        <li>4. Then create Bins here</li>
                    </ol>
                </div>
            ) : null}

            {isAdding && (
                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200 mb-6 animate-fade-in">
                    <h3 className="font-bold text-indigo-900 mb-4">New Storage Bin</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-indigo-800 mb-1">Parent Rack</label>
                            {racks.length === 0 ? (
                                <div className="w-full border rounded p-2 text-sm text-slate-500 bg-slate-50">
                                    No racks available. Create a warehouse, zone, and rack first.
                                </div>
                            ) : (
                                <select className="w-full border rounded p-2 text-sm" value={newBin.rackId} onChange={e => setNewBin({...newBin, rackId: e.target.value})}>
                                    <option value="">Select Rack</option>
                                    {racks.map(r => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}
                                </select>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-indigo-800 mb-1">Shelf Level</label>
                            <input type="number" min="1" max="10" className="w-full border rounded p-2 text-sm" value={newBin.shelfLevel} onChange={e => setNewBin({...newBin, shelfLevel: Number(e.target.value)})}/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-indigo-800 mb-1">Bin Name (e.g. B01)</label>
                            <input type="text" className="w-full border rounded p-2 text-sm" value={newBin.name} onChange={e => setNewBin({...newBin, name: e.target.value})}/>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-500 hover:bg-white rounded text-sm">Cancel</button>
                        <button onClick={handleAdd} disabled={racks.length === 0} className="bg-indigo-600 text-white px-6 py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50">Create Bin</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? <div className="col-span-3 text-center py-8"><Loader2 className="animate-spin inline"/></div> :
                 filteredBins.length === 0 ? <div className="col-span-3 text-center text-slate-500 py-8">No bins found.</div> :
                  filteredBins.map(bin => {
                     const current = bin.currentOccupancy !== undefined ? bin.currentOccupancy : (bin.current || 0);
                     const capacity = bin.maxCapacity !== undefined ? bin.maxCapacity : (bin.capacity || 0);
                     const utilization = capacity > 0 ? (current / capacity) * 100 : 0;
                     return (
                        <div key={bin.id} className="border border-slate-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow relative group">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-slate-800">{bin.name}</h4>
                                    <p className="text-xs font-mono text-slate-500 bg-slate-100 px-1 rounded inline-block mt-1">{bin.binCode || bin.code || 'N/A'}</p>
                                </div>
                                <img src={getQrUrl(bin.binCode || bin.code || '')} alt="QR" className="w-10 h-10 opacity-50"/>
                            </div>
                            
                            <div className="mt-3">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-500 flex items-center gap-1"><Box size={10}/> {current} / {capacity}</span>
                                    <span className={`font-bold ${utilization > 90 ? 'text-red-600' : 'text-green-600'}`}>{utilization.toFixed(0)}% Full</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5">
                                    <div 
                                        className={`h-1.5 rounded-full ${utilization > 90 ? 'bg-red-500' : utilization > 50 ? 'bg-orange-500' : 'bg-green-500'}`} 
                                        style={{width: `${utilization}%`}}
                                    ></div>
                                </div>
                            </div>

                            <button onClick={() => handleDelete(bin.id)} className="absolute bottom-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={16}/>
                            </button>
                        </div>
                     );
                 })}
            </div>
        </div>
    </div>
  );
};

export default BinManagementView;
