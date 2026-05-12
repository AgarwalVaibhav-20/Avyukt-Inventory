import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Layers, 
  Package, 
  BarChart3,
  ChevronRight,
  Filter,
  Download
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchVariants, createVariant, updateVariant, deleteVariant } from '@/store/slices/itemVariantSlice';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { productService } from '@/services/productService';
import { InventoryItem } from '@/types';
import Pagination from '@/components/common/Pagination';
import { useListControls } from '@/hooks/useListControls';

const ItemVariantPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { variants, loading } = useAppSelector((state) => state.itemVariants);
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newVariant, setNewVariant] = useState({
    productId: '',
    variantName: '',
    sku: '',
    barcode: '',
    price: 0,
    attributes: [{ name: '', value: '' }]
  });

  useEffect(() => {
    dispatch(fetchVariants());
    const loadProducts = async () => {
      const data = await productService.getAllItems();
      setProducts(data);
    };
    loadProducts();
  }, [dispatch]);

  useEffect(() => {
    const sku = searchParams.get('sku');
    const itemId = searchParams.get('item');
    if (sku && !itemId) {
      setSearchTerm(sku);
    } else if (itemId) {
      setSearchTerm('');
    }
    if (itemId) {
      setNewVariant((current) => ({ ...current, productId: itemId }));
    }
  }, [searchParams]);

  const handleAddAttribute = () => {
    setNewVariant(prev => ({
      ...prev,
      attributes: [...prev.attributes, { name: '', value: '' }]
    }));
  };

  const handleAttributeChange = (index: number, field: 'name' | 'value', value: string) => {
    setNewVariant(prev => {
      const updatedAttributes = [...prev.attributes];
      updatedAttributes[index] = { ...updatedAttributes[index], [field]: value };
      return { ...prev, attributes: updatedAttributes };
    });
  };

  const handleRemoveAttribute = (index: number) => {
    setNewVariant(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  const handleEdit = (variant: any) => {
    setIsEditing(true);
    setEditingId(variant._id);
    setNewVariant({
      productId: variant.productId?._id || variant.productId,
      variantName: variant.variantName,
      sku: variant.sku,
      barcode: variant.barcode || '',
      price: variant.price || 0,
      attributes: variant.attributes.length > 0 ? variant.attributes : [{ name: '', value: '' }]
    });
    setIsAddDialogOpen(true);
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setNewVariant({
      productId: '',
      variantName: '',
      sku: '',
      barcode: '',
      price: 0,
      attributes: [{ name: '', value: '' }]
    });
  };

  const handleSave = async () => {
    if (!newVariant.productId || !newVariant.sku || !newVariant.variantName) {
      alert("Please fill in all required fields (Product, SKU, Variant Name)");
      return;
    }
    
    if (isEditing && editingId) {
      await dispatch(updateVariant({ id: editingId, data: newVariant }));
    } else {
      await dispatch(createVariant(newVariant));
    }
    
    setIsAddDialogOpen(false);
    resetForm();
  };

  const linkedItemId = searchParams.get('item');
  const {
    filteredItems: filteredVariants,
    pagedItems: pagedVariants,
    page,
    pageSize,
    totalItems,
    totalPages,
    setPage,
    setPageSize,
  } = useListControls({
    items: variants,
    searchTerm: linkedItemId ? "" : searchTerm,
    filters: { linkedItemId },
    initialPageSize: 10,
    searchFn: (v, term) =>
      v.variantName.toLowerCase().includes(term) ||
      v.sku.toLowerCase().includes(term) ||
      (v.barcode || '').toLowerCase().includes(term),
    filterFn: (v, filters) => {
      return filters.linkedItemId
        ? v.productId?._id === filters.linkedItemId || v.productId === filters.linkedItemId
        : true;
    },
  });

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Layers className="text-blue-600" size={32} />
            Item Variants
          </h1>
          <p className="text-slate-500 mt-1 text-lg">Manage product variations, SKUs, and stock levels.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 bg-white shadow-sm hover:bg-slate-50">
            <Download size={18} /> Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsEditing(false)} className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md">
                <Plus size={18} /> Create Variant
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">{isEditing ? 'Edit Variant' : 'Add New Variant'}</DialogTitle>
                <CardDescription>
                  {isEditing ? 'Update the specific variation details for this product.' : 'Configure specific variation details for a product.'}
                </CardDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-6 py-4">
                <div className="space-y-2">
                  <Label>Parent Product</Label>
                  <Select 
                    value={newVariant.productId} 
                    onValueChange={(val) => setNewVariant(prev => ({...prev, productId: val}))}
                  >
                    <SelectTrigger className="bg-slate-50/50">
                      <SelectValue placeholder="Select Product" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {products.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Variant Name</Label>
                  <Input 
                    placeholder="e.g. Blue / Large" 
                    value={newVariant.variantName}
                    onChange={(e) => setNewVariant(prev => ({...prev, variantName: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input 
                    placeholder="Unique SKU" 
                    value={newVariant.sku}
                    onChange={(e) => setNewVariant(prev => ({...prev, sku: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Barcode</Label>
                  <Input 
                    placeholder="Universal Barcode" 
                    value={newVariant.barcode}
                    onChange={(e) => setNewVariant(prev => ({...prev, barcode: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input 
                    type="number"
                    placeholder="Unit Price" 
                    value={newVariant.price || ''}
                    onChange={(e) => setNewVariant(prev => ({...prev, price: parseFloat(e.target.value) || 0}))}
                  />
                </div>
                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-base font-semibold">Attributes</Label>
                    <Button variant="ghost" size="sm" onClick={handleAddAttribute} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                      <Plus size={16} /> Add Attribute
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {newVariant.attributes.map((attr, idx) => (
                      <div key={idx} className="flex gap-4 items-center animate-in fade-in slide-in-from-top-1">
                        <Input 
                          placeholder="Name (e.g. Color)" 
                          value={attr.name}
                          onChange={(e) => handleAttributeChange(idx, 'name', e.target.value)}
                        />
                        <Input 
                          placeholder="Value (e.g. Red)" 
                          value={attr.value}
                          onChange={(e) => handleAttributeChange(idx, 'value', e.target.value)}
                        />
                        {idx > 0 && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-slate-400 hover:text-red-500"
                            onClick={() => handleRemoveAttribute(idx)}
                          >
                            <Trash2 size={18} />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                  {isEditing ? 'Update Variant' : 'Save Variant'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white border-none shadow-sm ring-1 ring-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Total Variants</CardTitle>
            <Layers className="text-blue-600" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{variants.length}</div>
            <p className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1">
              Active in catalog
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm ring-1 ring-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Out of Stock</CardTitle>
            <Package className="text-amber-600" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-slate-400 mt-1">Requires attention</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm ring-1 ring-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Stock Value</CardTitle>
            <BarChart3 className="text-emerald-600" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹0.00</div>
            <p className="text-xs text-slate-400 mt-1">Estimated inventory value</p>
          </CardContent>
        </Card>
      </div>

      {/* Table Section */}
      <Card className="bg-white border-none shadow-sm ring-1 ring-slate-200">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Search by SKU or Variant Name..." 
              className="pl-10 h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100">
              <Filter size={20} />
            </Button>
            <Separator orientation="vertical" className="h-8 mx-2" />
            <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              Showing {filteredVariants.length} records
            </div>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-100">
                  <th className="px-6 py-4 text-left">Variant Details</th>
                  <th className="px-6 py-4 text-left">SKU & Barcode</th>
                  <th className="px-6 py-4 text-left">Attributes</th>
                  <th className="px-6 py-4 text-left">Stock Level</th>
                  <th className="px-6 py-4 text-left">Price</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({length: 3}).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-8">
                        <div className="h-4 bg-slate-100 rounded w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredVariants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-3">
                        <Package size={48} className="text-slate-200" />
                        <p className="text-lg font-medium">No variants found</p>
                        <p className="text-sm">Try adjusting your search or add a new variant.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagedVariants.map((variant) => (
                    <tr key={variant._id} className="group hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                            {variant.variantName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{variant.variantName}</div>
                            <div className="text-xs text-slate-400 mt-0.5">Parent: {variant.productId?.name || 'Unknown'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                            <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">{variant.sku}</Badge>
                          </div>
                          <div className="text-xs text-slate-400 font-mono">{variant.barcode || '---'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {variant.attributes.map((attr, i) => (
                            <Badge key={i} className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none px-2 py-0.5">
                              <span className="opacity-50 mr-1">{attr.name}:</span> {attr.value}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <div className={`w-2 h-2 rounded-full ${variant.stocks?.reduce((acc, s) => acc + s.quantity, 0) > 10 ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                          {variant.stocks?.reduce((acc, s) => acc + s.quantity, 0) || 0} Units
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900">₹{variant.price.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-blue-600"
                            onClick={() => handleEdit(variant)}
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-red-500"
                            onClick={() => dispatch(deleteVariant(variant._id))}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
        <div className="px-6 border-t border-slate-100">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </Card>
    </div>
  );
};

export default ItemVariantPage;
