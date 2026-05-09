import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Building2,
  MapPin,
  Package,
  User,
  Trash2,
  Edit2,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  ChevronRight,
  ArrowUpRight,
  BarChart3,
  Phone,
  Layers,
  Calendar,
} from "lucide-react";

// Redux
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { 
  fetchWarehouses, 
  addWarehouse, 
  removeWarehouse, 
  updateWarehouse 
} from "@/store/slices/warehouseSlice";
import { Warehouse } from "@/types";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Pagination from "@/components/common/Pagination";
import { useListControls } from "@/hooks/useListControls";

const WarehouseMasterView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { warehouses, loading } = useAppSelector((state) => state.warehouse);
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  
  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  
  const [formData, setFormData] = useState<Omit<Warehouse, "id">>({
    name: "",
    location: "",
    type: "General",
    capacity: 0,
    contactPerson: "",
  });

  useEffect(() => {
    dispatch(fetchWarehouses());
  }, [dispatch]);

  const handleOpenForm = (warehouse?: Warehouse) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        name: warehouse.name,
        location: warehouse.location,
        type: warehouse.type,
        capacity: warehouse.capacity,
        contactPerson: warehouse.contactPerson,
      });
    } else {
      setEditingWarehouse(null);
      setFormData({
        name: "",
        location: "",
        type: "General",
        capacity: 0,
        contactPerson: "",
      });
    }
    setIsFormOpen(true);
  };

  const handleOpenDetails = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setIsDetailsOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingWarehouse) {
        await dispatch(updateWarehouse({ id: editingWarehouse.id, data: formData })).unwrap();
      } else {
        await dispatch(addWarehouse(formData)).unwrap();
      }
      setIsFormOpen(false);
    } catch (error) {
      alert("Error saving warehouse");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this warehouse?")) {
      try {
        await dispatch(removeWarehouse(id)).unwrap();
      } catch (error) {
        alert("Error deleting warehouse");
      }
    }
  };

  const {
    filteredItems: filteredWarehouses,
    pagedItems,
    page,
    pageSize,
    totalItems,
    totalPages,
    setPage,
    setPageSize,
  } = useListControls({
    items: warehouses,
    searchTerm,
    filters: { type: typeFilter },
    initialPageSize: 9,
    searchFn: (w, term) =>
      w.name.toLowerCase().includes(term) ||
      w.location.toLowerCase().includes(term) ||
      w.contactPerson.toLowerCase().includes(term),
    filterFn: (w, filters) => filters.type === "all" || w.type === filters.type,
  });

  const stats = [
    { label: "Total Warehouses", value: warehouses.length, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Capacity", value: `${warehouses.reduce((acc, curr) => acc + (curr.capacity || 0), 0).toLocaleString()} sq ft`, icon: Package, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Active Locations", value: new Set(warehouses.map((w) => w.location)).size, icon: MapPin, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Avg. Utilization", value: "78%", icon: BarChart3, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  if (loading && warehouses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Warehouse Master</h1>
          <p className="text-slate-500 mt-1 text-lg">Centralized management of storage infrastructure.</p>
        </div>
        <Button 
          size="lg" 
          onClick={() => handleOpenForm()} 
          className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
        >
          <Plus className="mr-2 h-5 w-5" /> Add Warehouse
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">{stat.label}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon size={18} />
                </div>
             </CardHeader>
             <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <ArrowUpRight size={12} className="text-emerald-500" /> 
                  <span>+2.5% from last month</span>
                </p>
             </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Search by name, location or type..."
            className="pl-10 h-11 bg-slate-50/50 border-none focus-visible:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-56 h-11 bg-slate-50/50 border-none">
            <SelectValue placeholder="Warehouse type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="General">General</SelectItem>
            <SelectItem value="Distribution Center">Distribution Center</SelectItem>
            <SelectItem value="Cold Storage">Cold Storage</SelectItem>
            <SelectItem value="Retail Store">Retail Store</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-lg border border-slate-100">
          <Button
            variant={viewMode === "grid" ? "white" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "shadow-sm" : "text-slate-500"}
          >
            <LayoutGrid size={18} />
          </Button>
          <Button
            variant={viewMode === "list" ? "white" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "shadow-sm" : "text-slate-500"}
          >
            <ListIcon size={18} />
          </Button>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pagedItems.map((w) => (
            <Card key={w.id} className="group border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-xl transition-all duration-300">
               <div className="h-1.5 bg-blue-600 w-full rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity" />
               <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                      <Building2 size={22} />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenForm(w)} className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(w.id)} className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">{w.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1.5 mt-1">
                      <MapPin size={14} /> {w.location}
                    </CardDescription>
                  </div>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</p>
                      <Badge variant="secondary" className="mt-1 font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">
                        {w.type}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Capacity</p>
                      <p className="text-sm font-semibold text-slate-700 mt-1">{w.capacity.toLocaleString()} sq ft</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold border border-indigo-100">
                        {w.contactPerson.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-slate-600">{w.contactPerson}</span>
                    </div>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-blue-600 font-bold hover:no-underline flex items-center gap-1 group/btn"
                      onClick={() => handleOpenDetails(w)}
                    >
                      View details <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
               </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-slate-100 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="font-bold">Warehouse</TableHead>
                <TableHead className="font-bold">Type</TableHead>
                <TableHead className="font-bold">Capacity</TableHead>
                <TableHead className="font-bold">Manager</TableHead>
                <TableHead className="text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedItems.map((w) => (
                <TableRow key={w.id} className="group cursor-pointer hover:bg-slate-50/50" onClick={() => handleOpenDetails(w)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Building2 size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{w.name}</p>
                        <p className="text-xs text-slate-500">{w.location}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-medium bg-slate-50">
                      {w.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">
                    {w.capacity.toLocaleString()} sq ft
                  </TableCell>
                  <TableCell className="text-slate-600">{w.contactPerson}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenForm(w)} className="h-8 w-8 text-slate-400 hover:text-blue-600">
                        <Edit2 size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(w.id)} className="h-8 w-8 text-slate-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[6, 9, 18, 36]}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="px-8 pt-8 pb-4 bg-white">
            <DialogTitle className="text-2xl font-bold">{editingWarehouse ? "Edit Warehouse" : "New Warehouse"}</DialogTitle>
            <DialogDescription>
              Update your storage infrastructure details.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-5 bg-white">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Warehouse Name</label>
              <Input 
                placeholder="e.g. Central Distribution Hub"
                className="h-12 rounded-xl border-slate-200 focus:ring-blue-500"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Location</label>
                <Input 
                  placeholder="e.g. Mumbai, MH"
                  className="h-12 rounded-xl border-slate-200"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Type</label>
                <Select 
                  value={formData.type} 
                  onValueChange={(val: any) => setFormData({ ...formData, type: val })}
                >
                  <SelectTrigger className="h-12 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Distribution Center">Distribution Center</SelectItem>
                    <SelectItem value="Cold Storage">Cold Storage</SelectItem>
                    <SelectItem value="Retail Store">Retail Store</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Capacity (sq ft)</label>
                <Input 
                  type="number"
                  placeholder="e.g. 50000"
                  className="h-12 rounded-xl border-slate-200"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Manager</label>
                <Input 
                  placeholder="Contact Person"
                  className="h-12 rounded-xl border-slate-200"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="px-8 pb-8 pt-2 bg-white">
            <Button variant="ghost" onClick={() => setIsFormOpen(false)} className="rounded-xl h-12 px-6">Cancel</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 rounded-xl h-12 px-8 shadow-lg shadow-blue-100">
              {editingWarehouse ? "Save Changes" : "Create Warehouse"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details View Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          {selectedWarehouse && (
            <>
              <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
                <div className="absolute -bottom-10 left-8 p-4 bg-white rounded-2xl shadow-xl">
                  <Building2 size={40} className="text-blue-600" />
                </div>
              </div>
              <div className="px-8 pt-14 pb-8 bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedWarehouse.name}</h2>
                    <p className="text-slate-500 flex items-center gap-1.5 mt-1">
                      <MapPin size={16} /> {selectedWarehouse.location}
                    </p>
                  </div>
                  <Badge className="bg-blue-50 text-blue-600 border-blue-100 px-3 py-1 uppercase tracking-wider">
                    {selectedWarehouse.type}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-10">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                        <Layers size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Storage Capacity</p>
                        <p className="text-lg font-semibold text-slate-800 mt-0.5">{selectedWarehouse.capacity.toLocaleString()} sq ft</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Warehouse Manager</p>
                        <p className="text-lg font-semibold text-slate-800 mt-0.5">{selectedWarehouse.contactPerson}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                        <Phone size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Info</p>
                        <p className="text-lg font-semibold text-slate-800 mt-0.5">+91 98765 43210</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-50 text-slate-400 rounded-lg">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Since</p>
                        <p className="text-lg font-semibold text-slate-800 mt-0.5">Aug 2023</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-slate-800">Operational Summary</h4>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">Live</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
                        <span>Current Occupancy</span>
                        <span>78%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[78%] rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex gap-3">
                   <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setIsDetailsOpen(false)}>Close</Button>
                   <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl h-12 shadow-lg shadow-blue-100"
                    onClick={() => {
                        setIsDetailsOpen(false);
                        handleOpenForm(selectedWarehouse);
                    }}
                   >
                     Edit Settings
                   </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WarehouseMasterView;
