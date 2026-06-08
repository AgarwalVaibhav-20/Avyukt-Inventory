import React, { useState, useEffect } from "react";
import { InventoryItem, Warehouse, InternalMovement, Bin, Zone, Rack } from "@/types";
import {
  ArrowRightLeft,
  Loader2,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createInternalMovementEntry,
  fetchStockMovementData,
} from "@/store/slices/stockMovementSlice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { warehouseService } from "@/services/warehouseService";

const InternalMovementView: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    internalMovements,
    items,
    warehouses,
    bins,
    loading,
    actionLoading,
    error,
  } = useAppSelector((state) => state.stockMovement);

  const [fromBinOpen, setFromBinOpen] = useState(false);
  const [toBinOpen, setToBinOpen] = useState(false);

  const [zones, setZones] = useState<Zone[]>([]);
  const [fromRacks, setFromRacks] = useState<Rack[]>([]);
  const [toRacks, setToRacks] = useState<Rack[]>([]);

  const [formData, setFormData] = useState({
    warehouseId: "",
    itemId: "",
    fromZoneId: "",
    fromRackId: "",
    fromBin: "",
    toZoneId: "",
    toRackId: "",
    toBin: "",
    quantity: 1,
    performedBy: "Admin User",
  });

  useEffect(() => {
    dispatch(fetchStockMovementData());
  }, [dispatch]);

  useEffect(() => {
    if (formData.warehouseId) {
      warehouseService.getZones(formData.warehouseId).then(setZones);
    } else {
      setZones([]);
    }
  }, [formData.warehouseId]);

  useEffect(() => {
    if (formData.fromZoneId) {
      warehouseService.getRacks(formData.warehouseId, formData.fromZoneId).then(setFromRacks);
    } else {
      setFromRacks([]);
    }
  }, [formData.fromZoneId, formData.warehouseId]);

  useEffect(() => {
    if (formData.toZoneId) {
      warehouseService.getRacks(formData.warehouseId, formData.toZoneId).then(setToRacks);
    } else {
      setToRacks([]);
    }
  }, [formData.toZoneId, formData.warehouseId]);

  const handleSubmit = async () => {
    if (
      !formData.warehouseId ||
      !formData.itemId ||
      !formData.fromBin ||
      !formData.toBin
    ) {
      return alert("Please fill all fields");
    }
    const selectedItem = items.find((i) => i.id === formData.itemId);
    try {
      await dispatch(
        createInternalMovementEntry({
          ...formData,
          itemName: selectedItem?.name || "Unknown",
        }),
      ).unwrap();
      alert("Movement Recorded!");
      setFormData({
        ...formData,
        itemId: "",
        fromBin: "",
        toBin: "",
        quantity: 1,
      });
    } catch (e) {
      alert("Failed");
    }
  };

  const typedMovements = internalMovements as InternalMovement[];
  const typedItems = items as InventoryItem[];
  const typedWarehouses = warehouses as Warehouse[];
  const typedBins = (bins || []) as Bin[];

  const handleWarehouseChange = (val: string) => {
    setFormData({
      ...formData,
      warehouseId: val,
      itemId: "",
      fromZoneId: "",
      fromRackId: "",
      fromBin: "",
      toZoneId: "",
      toRackId: "",
      toBin: "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <ArrowRightLeft className="text-blue-600" size={20} /> Internal
          Movement (Bin-to-Bin)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">
              Warehouse
            </label>
            <select
              className="w-full border border-slate-300 rounded-lg p-2 text-sm"
              value={formData.warehouseId}
              onChange={(e) => handleWarehouseChange(e.target.value)}
            >
              <option value="">Select Warehouse</option>
              {typedWarehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">
              Item to Move
            </label>
            <select
              className="w-full border border-slate-300 rounded-lg p-2 text-sm"
              value={formData.itemId}
              onChange={(e) =>
                setFormData({ ...formData, itemId: e.target.value })
              }
              disabled={!formData.warehouseId}
            >
              <option value="">
                {!formData.warehouseId ? "Select Warehouse First" : "Select Item"}
              </option>
              {typedItems
                .filter(i => 
                  !formData.warehouseId || 
                  i.stocks?.some(s => s.warehouseId === formData.warehouseId && s.quantity > 0)
                )
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.sku} - {i.name} (Stock: {i.stocks?.find(s => s.warehouseId === formData.warehouseId)?.quantity || 0})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Hierarchical Selection: FROM */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px]">1</span>
                Source Location (FROM)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Zone</label>
                    <select 
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                      value={formData.fromZoneId}
                      onChange={e => setFormData({...formData, fromZoneId: e.target.value, fromRackId: '', fromBin: ''})}
                      disabled={!formData.warehouseId}
                    >
                        <option value="">Select Zone</option>
                        {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Rack</label>
                    <select 
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                      value={formData.fromRackId}
                      onChange={e => setFormData({...formData, fromRackId: e.target.value, fromBin: ''})}
                      disabled={!formData.fromZoneId}
                    >
                        <option value="">Select Rack</option>
                        {fromRacks.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Bin</label>
                    <Popover open={fromBinOpen} onOpenChange={setFromBinOpen}>
                        <PopoverTrigger asChild disabled={!formData.fromRackId}>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={fromBinOpen}
                                className="w-full justify-between bg-white font-normal text-sm"
                            >
                                {formData.fromBin ? formData.fromBin : "Select bin..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 bg-white border border-slate-200 shadow-lg">
                            <Command>
                                <CommandInput placeholder="Search bin..." />
                                <CommandEmpty>No bin found.</CommandEmpty>
                                <CommandGroup className="max-h-[300px] overflow-y-auto">
                                    {typedBins
                                      .filter(b => b.rackId === formData.fromRackId)
                                      .map((bin) => {
                                        const binLabel = (bin as any).code || bin.binCode || bin.name;
                                        const selectedItem = typedItems.find(i => i.id === formData.itemId);
                                        const hasItem = selectedItem?.stocks?.some(s => 
                                          s.warehouseId === formData.warehouseId && s.binCode === (bin.binCode || bin.name)
                                        );

                                        return (
                                          <CommandItem
                                            key={bin.id}
                                            value={binLabel}
                                            onSelect={() => {
                                              setFormData({ ...formData, fromBin: binLabel });
                                              setFromBinOpen(false);
                                            }}
                                            className="cursor-pointer hover:bg-slate-100"
                                          >
                                            <Check className={cn("mr-2 h-4 w-4", formData.fromBin === binLabel ? "opacity-100" : "opacity-0")} />
                                            <div className="flex flex-col flex-1">
                                              <div className="flex items-center justify-between">
                                                <span>{binLabel}</span>
                                                {hasItem && (
                                                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">In Stock</span>
                                                )}
                                              </div>
                                              <span className="text-[10px] text-slate-400">
                                                Occupancy: {bin.currentOccupancy || (bin as any).current || 0} / {bin.maxCapacity || (bin as any).capacity || 0}
                                              </span>
                                            </div>
                                          </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </div>

        {/* Hierarchical Selection: TO */}
        <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px]">2</span>
                Destination Location (TO)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Zone</label>
                    <select 
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                      value={formData.toZoneId}
                      onChange={e => setFormData({...formData, toZoneId: e.target.value, toRackId: '', toBin: ''})}
                      disabled={!formData.warehouseId}
                    >
                        <option value="">Select Zone</option>
                        {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Rack</label>
                    <select 
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                      value={formData.toRackId}
                      onChange={e => setFormData({...formData, toRackId: e.target.value, toBin: ''})}
                      disabled={!formData.toZoneId}
                    >
                        <option value="">Select Rack</option>
                        {toRacks.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Bin</label>
                    <Popover open={toBinOpen} onOpenChange={setToBinOpen}>
                        <PopoverTrigger asChild disabled={!formData.toRackId}>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={toBinOpen}
                                className="w-full justify-between bg-white font-normal text-sm"
                            >
                                {formData.toBin ? formData.toBin : "Select bin..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 bg-white border border-slate-200 shadow-lg">
                            <Command>
                                <CommandInput placeholder="Search bin..." />
                                <CommandEmpty>No bin found.</CommandEmpty>
                                <CommandGroup className="max-h-[300px] overflow-y-auto">
                                    {typedBins
                                      .filter(b => b.rackId === formData.toRackId)
                                      .map((bin) => {
                                        const binLabel = (bin as any).code || bin.binCode || bin.name;
                                        return (
                                          <CommandItem
                                            key={bin.id}
                                            value={binLabel}
                                            onSelect={() => {
                                              setFormData({ ...formData, toBin: binLabel });
                                              setToBinOpen(false);
                                            }}
                                            className="cursor-pointer hover:bg-slate-100"
                                          >
                                            <Check className={cn("mr-2 h-4 w-4", formData.toBin === binLabel ? "opacity-100" : "opacity-0")} />
                                            <div className="flex flex-col">
                                              <span>{binLabel}</span>
                                              <span className="text-[10px] text-slate-400">
                                                Occupancy: {bin.currentOccupancy || (bin as any).current || 0} / {bin.maxCapacity || (bin as any).capacity || 0}
                                              </span>
                                            </div>
                                          </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">
              Quantity to Move
            </label>
            <input
              type="number"
              className="w-full border border-slate-300 rounded-lg p-2 text-sm"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: Number(e.target.value) })
              }
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSubmit}
              disabled={actionLoading}
              className="w-full bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {actionLoading ? (
                <Loader2 className="animate-spin-slow" size={16} />
              ) : (
                <ArrowRightLeft size={16} />
              )}
              Execute Bin-to-Bin Movement
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-800">Movement History</h3>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="p-3">Reference</th>
              <th className="p-3">Date</th>
              <th className="p-3">Item</th>
              <th className="p-3">From</th>
              <th className="p-3">To</th>
              <th className="p-3 text-right">Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {typedMovements.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-slate-500">
                  No movements recorded
                </td>
              </tr>
            ) : (
              typedMovements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="p-3 font-medium">{m.reference}</td>
                  <td className="p-3 text-slate-500">{m.date}</td>
                  <td className="p-3">{m.itemName}</td>
                  <td className="p-3">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs">
                      {m.fromBin}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                      {m.toBin}
                    </span>
                  </td>
                  <td className="p-3 text-right font-medium">{m.quantity}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InternalMovementView;
