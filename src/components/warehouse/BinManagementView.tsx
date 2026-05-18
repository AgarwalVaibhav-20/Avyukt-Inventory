import React, { useState, useEffect } from 'react';
import { warehouseService } from '@/services/warehouseService';
import ConfirmDeleteModal from '@/components/common/ConfirmDeleteModal';
import { Bin, Rack, Zone, Warehouse } from '@/types';
import {
  LayoutGrid,
  Plus,
  Trash2,
  Box,
  QrCode,
  Search,
  Loader2,
  X,
  Building2,
  Inbox,
  AlertTriangle,
  AlertOctagon,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { automationService } from '@/services/automationService';

const BinManagementView: React.FC = () => {
  const [bins, setBins] = useState<Bin[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedWhFilter, setSelectedWhFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Create Modal State
  const [isAdding, setIsAdding] = useState(false);
  const [newBin, setNewBin] = useState({
    rackId: '',
    shelfLevel: 1,
    name: '',
    maxCapacity: 100,
  });

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bData, wData] = await Promise.all([
        warehouseService.getAllBins(),
        warehouseService.getAllWarehouses(),
      ]);

      console.log('Loaded bins:', bData);
      console.log('Loaded warehouses:', wData);

      // Fetch all zones and racks for all warehouses to provide context
      const zonesPromises = wData.map((w) => warehouseService.getZones(w.id));
      const zonesResults = await Promise.all(zonesPromises);
      const allZones = zonesResults.flat();

      console.log('Loaded zones:', allZones);

      // Fetch racks for each zone individually
      const racksPromises = allZones.map((z) => {
        console.log(
          'Fetching racks for warehouse:',
          z.warehouseId,
          'zone:',
          z.id
        );
        return warehouseService.getRacks(z.warehouseId as string, z.id);
      });
      const racksResults = await Promise.all(racksPromises);
      const allRacks = racksResults.flat();

      console.log('Loaded racks:', allRacks);

      setBins(bData);
      setWarehouses(wData);
      setZones(allZones);
      setRacks(allRacks);
    } catch (error) {
      console.error('Failed to load bin management data', error);
      alert(`Error loading bin management: ${(error as any)?.message}`);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newBin.rackId || !newBin.name) return alert('Select Rack and Name');
    const rack = racks.find((r) => r.id === newBin.rackId);
    const zone = zones.find((z) => z.id === rack?.zoneId);
    if (!rack || !zone) {
      console.error('Rack not found:', newBin.rackId, 'Available racks:', racks);
      return alert('Rack or zone data is missing. Please refresh and try again.');
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
        status: 'Empty',
      } as any);
      console.log('Bin created successfully:', result);
      setIsAdding(false);
      setNewBin({ rackId: '', shelfLevel: 1, name: '', maxCapacity: 100 });
      loadData();
    } catch (error) {
      console.error('Failed to create bin:', error);
      alert(`Error creating bin: ${(error as any)?.message}`);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await warehouseService.deleteBin(deleteTargetId);
      loadData();
    } catch (error) {
      console.error('Failed to delete bin', error);
      alert(`Error deleting bin: ${(error as any)?.message}`);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setDeleteTargetId(null);
    }
  };

  const getQrUrl = (code: string) => automationService.getQrCodeImageUrl(code);

  const filteredBins = bins.filter((b) => {
    const matchesSearch =
      (b.binCode?.toLowerCase() || b.code?.toLowerCase() || '').includes(
        search.toLowerCase()
      ) || (b.name?.toLowerCase() || '').includes(search.toLowerCase());

    const matchesWarehouse =
      !selectedWhFilter || b.warehouseId === selectedWhFilter;

    const current =
      b.currentOccupancy !== undefined ? b.currentOccupancy : b.current || 0;
    const capacity =
      b.maxCapacity !== undefined ? b.maxCapacity : b.capacity || 0;
    const utilization = capacity > 0 ? (current / capacity) * 100 : 0;

    let matchesStatus = true;
    if (selectedStatusFilter === 'empty') {
      matchesStatus = current === 0;
    } else if (selectedStatusFilter === 'partial') {
      matchesStatus = current > 0 && utilization <= 90;
    } else if (selectedStatusFilter === 'near-full') {
      matchesStatus = utilization > 90 && utilization <= 100;
    } else if (selectedStatusFilter === 'overcapacity') {
      matchesStatus = utilization > 100;
    }

    return matchesSearch && matchesWarehouse && matchesStatus;
  });

  // Calculate statistics based on loaded bins
  const totalBinCount = bins.length;
  const emptyBinCount = bins.filter(
    (b) => (b.currentOccupancy || b.current || 0) === 0
  ).length;
  const warningBinCount = bins.filter((b) => {
    const cap = b.maxCapacity || b.capacity || 0;
    const cur = b.currentOccupancy || b.current || 0;
    const ut = cap > 0 ? (cur / cap) * 100 : 0;
    return ut > 90 && ut <= 100;
  }).length;
  const overcapacityBinCount = bins.filter((b) => {
    const cap = b.maxCapacity || b.capacity || 0;
    const cur = b.currentOccupancy || b.current || 0;
    const ut = cap > 0 ? (cur / cap) * 100 : 0;
    return ut > 100;
  }).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Bin Location Manager
          </h1>
          <p className="text-slate-500 mt-1 text-base">
            Configure and monitor individual storage slots in warehouse racks.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl text-sm font-extrabold flex gap-2 items-center shadow-lg shadow-indigo-100 transition-all transform hover:-translate-y-0.5"
        >
          <Plus size={16} /> Add Storage Bin
        </button>
      </div>

      {/* Statistics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Total Storage Units',
            value: totalBinCount,
            icon: LayoutGrid,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            desc: 'Active physical bin slots',
          },
          {
            label: 'Empty Locations',
            value: emptyBinCount,
            icon: Inbox,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            desc: 'Ready for incoming stock',
          },
          {
            label: 'Near Capacity (>90%)',
            value: warningBinCount,
            icon: AlertTriangle,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            desc: 'Optimal fill threshold met',
          },
          {
            label: 'Over-Capacity (>100%)',
            value: overcapacityBinCount,
            icon: AlertOctagon,
            color: 'text-rose-600',
            bg: 'bg-rose-50',
            desc: 'Requires stock clearance',
            pulse: overcapacityBinCount > 0,
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-100 shadow-sm hover:shadow-md rounded-3xl p-6 transition-all group relative overflow-hidden flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {stat.label}
              </span>
              <div
                className={`p-2.5 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform ${
                  stat.pulse ? 'animate-pulse' : ''
                }`}
              >
                <stat.icon size={18} />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-slate-800 tracking-tight">
                {stat.value}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                <ArrowUpRight size={12} className={stat.color} />
                <span>{stat.desc}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Advanced Filters Panel */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search by Bin Name or Location Code..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 focus:border-indigo-500/30 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-medium placeholder:text-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Warehouse filter */}
          <select
            value={selectedWhFilter}
            onChange={(e) => setSelectedWhFilter(e.target.value)}
            className="w-full sm:w-56 px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-600"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="w-full sm:w-56 px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-600"
          >
            <option value="">All Statuses</option>
            <option value="empty">Empty Slots</option>
            <option value="partial">Partially Filled</option>
            <option value="near-full">Near Full (&gt;90%)</option>
            <option value="overcapacity">Over-Capacity (&gt;100%)</option>
          </select>

          {(selectedWhFilter || selectedStatusFilter || search) && (
            <button
              onClick={() => {
                setSelectedWhFilter('');
                setSelectedStatusFilter('');
                setSearch('');
              }}
              className="text-xs font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors px-4 py-3"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Setup Guide */}
      {zones.length === 0 || racks.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 relative overflow-hidden animate-in fade-in duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
          <div className="flex gap-3">
            <AlertTriangle className="text-amber-600 shrink-0" size={20} />
            <div>
              <p className="text-sm text-amber-800 font-extrabold uppercase tracking-wider">
                Storage Hierarchy Setup Required
              </p>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                Before configuring individual storage bins, you must first construct
                your warehouse zones and racks inside the system:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 text-xs font-bold text-amber-800">
                <div className="bg-white/60 p-3 rounded-2xl border border-amber-100">
                  <span className="text-[10px] uppercase text-amber-500 block mb-1">
                    Step 1
                  </span>
                  Create Warehouse Master
                </div>
                <div className="bg-white/60 p-3 rounded-2xl border border-amber-100">
                  <span className="text-[10px] uppercase text-amber-500 block mb-1">
                    Step 2
                  </span>
                  Add Warehouse Zones
                </div>
                <div className="bg-white/60 p-3 rounded-2xl border border-amber-100">
                  <span className="text-[10px] uppercase text-amber-500 block mb-1">
                    Step 3
                  </span>
                  Assemble Target Racks
                </div>
                <div className="bg-white/60 p-3 rounded-2xl border border-amber-100">
                  <span className="text-[10px] uppercase text-amber-500 block mb-1">
                    Step 4
                  </span>
                  Map Shelves & Bins Here
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Add Storage Bin Form */}
      {isAdding && (
        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 mb-8 animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600"></div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-black text-slate-800 text-lg">
                New Storage Bin Location
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Assign a shelf code and max units limit for this slot.
              </p>
            </div>
            <button
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Parent Rack *
              </label>
              {racks.length === 0 ? (
                <div className="w-full border border-slate-200 rounded-xl p-2.5 text-sm text-slate-500 bg-slate-100">
                  No racks available. Please set up a Rack inside Zone Structure.
                </div>
              ) : (
                <select
                  className="w-full border border-slate-200 bg-white rounded-xl p-2.5 text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-700"
                  value={newBin.rackId}
                  onChange={(e) =>
                    setNewBin({ ...newBin, rackId: e.target.value })
                  }
                >
                  <option value="">Select Target Rack</option>
                  {racks.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Shelf Level *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                className="w-full border border-slate-200 bg-white rounded-xl p-2.5 text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-700"
                value={newBin.shelfLevel}
                onChange={(e) =>
                  setNewBin({ ...newBin, shelfLevel: Number(e.target.value) })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Bin Name (e.g. B01) *
              </label>
              <input
                type="text"
                className="w-full border border-slate-200 bg-white rounded-xl p-2.5 text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-700"
                value={newBin.name}
                onChange={(e) => setNewBin({ ...newBin, name: e.target.value })}
                placeholder="e.g. B01"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Max Capacity (Units) *
              </label>
              <input
                type="number"
                min="1"
                className="w-full border border-slate-200 bg-white rounded-xl p-2.5 text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-700"
                value={newBin.maxCapacity}
                onChange={(e) =>
                  setNewBin({ ...newBin, maxCapacity: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsAdding(false)}
              className="px-5 py-2.5 text-slate-500 hover:bg-white rounded-xl text-sm font-bold transition-all border border-transparent hover:border-slate-200"
            >
              Discard
            </button>
            <button
              onClick={handleAdd}
              disabled={racks.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl text-sm font-extrabold shadow-lg shadow-indigo-100 disabled:opacity-50 transition-all"
            >
              Confirm & Create
            </button>
          </div>
        </div>
      )}

      {/* Storage Bins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <Loader2
              className="animate-spin text-indigo-600 mb-4 inline-block"
              size={40}
            />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
              Syncing Storage Locations...
            </p>
          </div>
        ) : filteredBins.length === 0 ? (
          <div className="col-span-3 text-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <Inbox className="text-slate-200 mx-auto mb-4" size={60} />
            <h3 className="text-xl font-bold text-slate-700">No Bins Configured</h3>
            <p className="text-slate-400 text-sm mt-1">
              We couldn't find any bins matching your active filter criteria.
            </p>
          </div>
        ) : (
          filteredBins.map((bin) => {
            const current =
              bin.currentOccupancy !== undefined ? bin.currentOccupancy : bin.current || 0;
            const capacity =
              bin.maxCapacity !== undefined ? bin.maxCapacity : bin.capacity || 0;
            const utilization = capacity > 0 ? (current / capacity) * 100 : 0;

            return (
              <div
                key={bin.id}
                className="group bg-white border border-slate-100 rounded-3xl p-6 hover:shadow-2xl hover:border-indigo-150 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[250px]"
              >
                {/* Top Section */}
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                        BIN Location
                      </span>
                      <h4 className="font-black text-slate-800 text-xl tracking-tight mt-2">
                        {bin.name}
                      </h4>
                      <div className="mt-1">
                        <span
                          className="font-mono text-[10px] text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded select-all"
                          title="Location Code"
                        >
                          {bin.binCode || bin.code || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="relative group/qr">
                      <img
                        src={getQrUrl(bin.binCode || bin.code || '')}
                        alt="QR Code"
                        className="w-12 h-12 border border-slate-100 p-0.5 rounded-xl bg-white group-hover/qr:scale-115 transition-transform cursor-pointer shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Parent Warehouse & Zone Info */}
                  <div className="flex flex-wrap gap-2 mb-4 mt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100/50 px-2 py-0.5 rounded flex items-center gap-1">
                      <Building2 size={10} />
                      {warehouses.find((w) => w.id === bin.warehouseId)?.name ||
                        'Warehouse'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100/50 px-2 py-0.5 rounded flex items-center gap-1">
                      <Layers size={10} />
                      Zone {bin.zone || 'A'}
                    </span>
                  </div>
                </div>

                {/* Occupancy Indicator */}
                <div className="mt-2 space-y-3">
                  <div className="flex justify-between items-end text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Occupancy
                      </span>
                      <span className="text-slate-700 font-bold flex items-center gap-1">
                        <Box size={12} className="text-slate-400" />
                        <span className="text-sm font-black">{current}</span>
                        <span className="text-slate-400 font-normal">
                          / {capacity} units
                        </span>
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        utilization > 100
                          ? 'bg-red-50 text-red-700 border border-red-100 animate-pulse'
                          : utilization > 90
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : utilization === 0
                              ? 'bg-slate-100 text-slate-500 border border-slate-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}
                    >
                      {utilization > 100
                        ? `${utilization.toFixed(0)}% Overlimit`
                        : `${utilization.toFixed(0)}% Full`}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          utilization > 100
                            ? 'bg-gradient-to-r from-red-500 to-rose-600 animate-pulse'
                            : utilization > 90
                              ? 'bg-amber-500'
                              : utilization > 50
                                ? 'bg-orange-400'
                                : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, utilization)}%` }}
                      ></div>
                    </div>

                    {utilization > 100 && (
                      <div className="bg-red-50 border border-red-100 text-[10px] text-red-700 rounded-xl p-2.5 flex items-start gap-1.5 mt-2">
                        <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold uppercase">
                            Overcapacity:
                          </span>{' '}
                          Exceeds maximum limit by{' '}
                          <span className="font-black">{current - capacity}</span>{' '}
                          units!
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Tray */}
                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-50 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => handleDeleteClick(bin.id)}
                      className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-red-500 rounded-xl transition-all border border-slate-100 hover:border-rose-100"
                      title="Delete Location"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        itemName={bins.find((bin) => bin.id === deleteTargetId)?.name}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};

export default BinManagementView;
