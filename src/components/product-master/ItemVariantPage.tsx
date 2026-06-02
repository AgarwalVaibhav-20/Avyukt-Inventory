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
import { warehouseService } from '@/services/warehouseService';
import { InventoryItem } from '@/types';
import Pagination from '@/components/common/Pagination';
import { useListControls } from '@/hooks/useListControls';
import { NotionSelect } from '@/components/common/NotionSelect';

const ItemVariantPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { variants, loading } = useAppSelector((state) => state.itemVariants);
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [productFilter, setProductFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');
  const [attributeFilter, setAttributeFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('All');
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uoms, setUoms] = useState<any[]>([]);
  const [allWarehouses, setAllWarehouses] = useState<any[]>([]);
  const [newVariant, setNewVariant] = useState({
    productId: '',
    variantName: '',
    sku: '',
    barcode: '',
    unit: '',
    price: 0,
    attributes: [{ name: '', value: '' }],
    stocks: [{ warehouseId: '', quantity: 0 }]
  });

  useEffect(() => {
    dispatch(fetchVariants(undefined));
    const loadData = async () => {
      const [productData, uomData, warehouseData] = await Promise.all([
        productService.getAllItems(),
        productService.getUOMs(),
        warehouseService.getAllWarehouses()
      ]);
      setProducts(productData);
      setUoms(uomData);
      setAllWarehouses(warehouseData);
    };
    loadData();
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
      setProductFilter(itemId);
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
      unit: variant.unit || '',
      price: variant.price || 0,
      attributes: variant.attributes.length > 0 ? variant.attributes : [{ name: '', value: '' }],
      stocks: variant.stocks && variant.stocks.length > 0 ? variant.stocks : [{ warehouseId: '', quantity: 0 }]
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
      unit: '',
      price: 0,
      attributes: [{ name: '', value: '' }],
      stocks: [{ warehouseId: '', quantity: 0 }]
    });
  };

  const handleSave = async () => {
    if (!newVariant.productId || !newVariant.sku || !newVariant.variantName) {
      alert("Please fill in all required fields (Product, SKU, Variant Name)");
      return;
    }
    
    const payload = {
      ...newVariant,
      stocks: newVariant.stocks.filter(s => s.warehouseId && s.quantity >= 0)
    };

    if (isEditing && editingId) {
      await dispatch(updateVariant({ id: editingId, data: payload }));
    } else {
      await dispatch(createVariant(payload));
    }
    
    setIsAddDialogOpen(false);
    resetForm();
  };

  const linkedItemId = searchParams.get('item');
  const getVariantProductId = (variant: any) => {
    const productId = variant.productId;
    if (!productId) return '';
    if (typeof productId === 'string') return productId;
    return productId._id || productId.id || '';
  };

  const getVariantStock = (variant: any) =>
    (variant.stocks || []).reduce((acc: number, stock: any) => acc + Number(stock.quantity || 0), 0);

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
    filters: {
      linkedItemId,
      productFilter,
      stockFilter,
      attributeFilter,
      unitFilter,
      minPriceFilter,
      maxPriceFilter,
    },
    initialPageSize: 10,
    searchFn: (v, term) =>
      (v.variantName || '').toLowerCase().includes(term) ||
      (v.sku || '').toLowerCase().includes(term) ||
      (v.barcode || '').toLowerCase().includes(term) ||
      (v.productId?.name || '').toLowerCase().includes(term) ||
      (v.attributes || []).some((attr) =>
        `${attr.name || ''} ${attr.value || ''}`.toLowerCase().includes(term),
      ),
    filterFn: (v, filters) => {
      const productId = getVariantProductId(v);
      const activeProductFilter = filters.linkedItemId || filters.productFilter;
      const stock = getVariantStock(v);
      const price = Number(v.price || 0);
      const attributeTerm = String(filters.attributeFilter || '').trim().toLowerCase();

      const matchesProduct =
        !activeProductFilter || activeProductFilter === 'All' || productId === activeProductFilter;
      const matchesStock =
        filters.stockFilter === 'All' ||
        (filters.stockFilter === 'in-stock' && stock > 0) ||
        (filters.stockFilter === 'low-stock' && stock > 0 && stock <= 10) ||
        (filters.stockFilter === 'out-of-stock' && stock === 0);
      const matchesAttribute =
        !attributeTerm ||
        (v.attributes || []).some((attr) =>
          `${attr.name || ''} ${attr.value || ''}`.toLowerCase().includes(attributeTerm),
        );
      const matchesUnit = filters.unitFilter === 'All' || v.unit === filters.unitFilter;
      const matchesMinPrice = !filters.minPriceFilter || price >= Number(filters.minPriceFilter);
      const matchesMaxPrice = !filters.maxPriceFilter || price <= Number(filters.maxPriceFilter);

      return matchesProduct && matchesStock && matchesAttribute && matchesUnit && matchesMinPrice && matchesMaxPrice;
    },
  });

  const clearFilters = () => {
    setSearchTerm('');
    setProductFilter(linkedItemId || 'All');
    setStockFilter('All');
    setAttributeFilter('');
    setUnitFilter('All');
    setMinPriceFilter('');
    setMaxPriceFilter('');
  };

  // Stats calculations
  const outOfStockCount = variants.filter(v => getVariantStock(v) === 0).length;
  const totalStockValue = variants.reduce((acc, v) => acc + (v.price || 0) * getVariantStock(v), 0);

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
                  <NotionSelect 
                    value={newVariant.productId} 
                    onValueChange={(val) => setNewVariant(prev => ({...prev, productId: val}))}
                    placeholder="Select Product"
                    options={products.map(p => ({ label: p.name, value: p.id }))}
                  />
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
                  <Label>Unit of Measure</Label>
                  <NotionSelect 
                    value={newVariant.unit} 
                    onValueChange={(val) => setNewVariant(prev => ({...prev, unit: val}))}
                    placeholder="Select Unit"
                    options={uoms.map(u => ({ label: `${u.name} (${u.code})`, value: u.code }))}
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

                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-2 pt-2 border-t border-slate-100">
                    <Label className="text-base font-semibold">Warehouse Stock (Initial)</Label>
                    <Button variant="ghost" size="sm" onClick={() => setNewVariant(prev => ({ ...prev, stocks: [...prev.stocks, { warehouseId: '', quantity: 0 }] }))} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                      <Plus size={16} /> Add Warehouse
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {newVariant.stocks.map((stock, idx) => (
                      <div key={idx} className="flex gap-4 items-center animate-in fade-in slide-in-from-top-1">
                        <NotionSelect 
                          value={stock.warehouseId} 
                          onValueChange={(val) => {
                            const updated = [...newVariant.stocks];
                            updated[idx] = { ...updated[idx], warehouseId: val };
                            setNewVariant(prev => ({ ...prev, stocks: updated }));
                          }}
                          placeholder="Select Warehouse"
                          options={allWarehouses.map(w => ({ label: w.name, value: w.id }))}
                          className="flex-1"
                        />
                        <Input 
                          type="number"
                          placeholder="Quantity" 
                          className="w-32"
                          value={stock.quantity || ''}
                          onChange={(e) => {
                            const updated = [...newVariant.stocks];
                            updated[idx] = { ...updated[idx], quantity: parseFloat(e.target.value) || 0 };
                            setNewVariant(prev => ({ ...prev, stocks: updated }));
                          }}
                        />
                        {idx > 0 && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-slate-400 hover:text-red-500"
                            onClick={() => {
                              setNewVariant(prev => ({ ...prev, stocks: prev.stocks.filter((_, i) => i !== idx) }));
                            }}
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
            <div className="text-3xl font-bold">{outOfStockCount}</div>
            <p className="text-xs text-slate-400 mt-1">Requires attention</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm ring-1 ring-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-500">Stock Value</CardTitle>
            <BarChart3 className="text-emerald-600" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{totalStockValue.toLocaleString()}</div>
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
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-500 hover:bg-slate-100"
              onClick={() => setShowFilters((current) => !current)}
              title="Toggle filters"
            >
              <Filter size={20} />
            </Button>
            <Separator orientation="vertical" className="h-8 mx-2" />
            <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              Showing {filteredVariants.length} records
            </div>
          </div>
        </div>
        {showFilters && (
          <div className="grid gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4 md:grid-cols-5">
            <NotionSelect 
              value={productFilter} 
              onValueChange={setProductFilter} 
              placeholder="Product"
              options={[{ label: "All Products", value: "All" }, ...products.map(p => ({ label: p.name, value: p.id }))]}
              className="bg-white"
            />
            <NotionSelect 
              value={stockFilter} 
              onValueChange={setStockFilter}
              placeholder="Stock"
              options={[
                { label: "All Stock", value: "All" },
                { label: "In Stock", value: "in-stock" },
                { label: "Low Stock", value: "low-stock" },
                { label: "Out of Stock", value: "out-of-stock" }
              ]}
              className="bg-white"
            />
            <Input
              value={attributeFilter}
              onChange={(event) => setAttributeFilter(event.target.value)}
              placeholder="Attribute name/value"
              className="bg-white"
            />
            <NotionSelect 
              value={unitFilter} 
              onValueChange={setUnitFilter}
              placeholder="Unit"
              options={[{ label: "All Units", value: "All" }, ...uoms.map(u => ({ label: u.name, value: u.code }))]}
              className="bg-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                min="0"
                value={minPriceFilter}
                onChange={(event) => setMinPriceFilter(event.target.value)}
                placeholder="Min price"
                className="bg-white"
              />
              <Input
                type="number"
                min="0"
                value={maxPriceFilter}
                onChange={(event) => setMaxPriceFilter(event.target.value)}
                placeholder="Max price"
                className="bg-white"
              />
            </div>
            <Button variant="outline" onClick={clearFilters} className="bg-white">
              Clear Filters
            </Button>
          </div>
        )}
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
                            <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {variant.variantName}
                              {variant.unit && (
                                <span className="ml-2 text-[10px] font-normal px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">
                                  {variant.unit}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              Parent: {variant.productId?.name || products.find(p => p.id === (variant.productId?._id || variant.productId))?.name || 'Unknown'}
                            </div>
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
                          <div className={`w-2 h-2 rounded-full ${getVariantStock(variant) > 10 ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                          {getVariantStock(variant)} Units
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
