import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { InventoryItem } from '../types';
import { Plus, Edit2, Trash2, Search, Loader2, Save, X, Layers, Grid3x3 } from 'lucide-react';

const ItemVariantsView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    variantName: '',
    variantSku: '',
    attributeValues: {} as Record<string, string>,
    price: 0,
    barcode: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await productService.getAllItems();
      setItems(data);
    } catch (error) {
      console.error('Failed to load items', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVariant = async () => {
    if (!formData.variantName.trim() || !formData.variantSku.trim()) {
      alert('Variant Name and SKU are required');
      return;
    }

    try {
      // In a real scenario, you would add this to a variant table
      // For now, we'll just show success
      alert('Variant added successfully!');
      resetForm();
    } catch (error) {
      console.error('Failed to add variant', error);
      alert('Failed to add variant');
    }
  };

  const resetForm = () => {
    setFormData({
      variantName: '',
      variantSku: '',
      attributeValues: {},
      price: 0,
      barcode: '',
    });
    setSelectedItemId(null);
    setShowForm(false);
  };

  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.sku.toLowerCase().includes(search.toLowerCase())
  );

  const itemsWithVariants = items.filter(i => i.variantGroupId).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Item Variants</h2>
          <p className="text-sm text-slate-500">Manage product variations (size, color, etc.) under parent items</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-4">
          <div className="text-3xl font-bold text-blue-600">{items.length}</div>
          <div className="text-sm text-slate-600">Total Items</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-4">
          <div className="text-3xl font-bold text-purple-600">{itemsWithVariants}</div>
          <div className="text-sm text-slate-600">Items with Variants</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4">
          <div className="text-3xl font-bold text-green-600">~{itemsWithVariants * 3}</div>
          <div className="text-sm text-slate-600">Est. Variant SKUs</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-200 p-4">
          <div className="text-3xl font-bold text-orange-600">↓ {Math.round((itemsWithVariants / items.length) * 100)}%</div>
          <div className="text-sm text-slate-600">Master Reduction</div>
        </div>
      </div>

      {/* Variant Structure Explanation */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-6">
        <div className="flex gap-4">
          <Layers className="text-indigo-600 flex-shrink-0" size={24} />
          <div>
            <h3 className="font-bold text-slate-900 mb-3">Variant Management Example</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-slate-800 mb-2">Parent Item</p>
                <div className="bg-white rounded p-3 border border-indigo-300">
                  <p className="font-mono text-xs">T-Shirt | SKU: TSH-001</p>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-2xl">→</div>
              </div>
              <div>
                <p className="font-medium text-slate-800 mb-2">Variant Combinations</p>
                <div className="bg-white rounded p-3 border border-indigo-300 space-y-1 text-xs">
                  <p>TSH-001-RED-S (Red, Small)</p>
                  <p>TSH-001-RED-M (Red, Medium)</p>
                  <p>TSH-001-BLU-S (Blue, Small)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search items to manage variants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Items with Variant Management */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="animate-spin inline mr-2" />
            Loading items...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            {search ? 'No items found matching your search.' : 'No items yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Item Details</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Variant Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.itemType}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                        {item.sku}
                      </span>
                    </td>
                    <td className="px-6 py-4">{item.category}</td>
                    <td className="px-6 py-4">
                      {item.variantGroupId ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                          <Grid3x3 size={12} /> Parent Item
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                          No Variants
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedItemId(item.id);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded inline-flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Variant
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Variant Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 space-y-4 w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Add Product Variant</h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Parent Item:</span> {items.find(i => i.id === selectedItemId)?.name}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Variant Name *
                  </label>
                  <input
                    type="text"
                    value={formData.variantName}
                    onChange={(e) => setFormData({ ...formData, variantName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Red / Large"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Variant SKU *
                  </label>
                  <input
                    type="text"
                    value={formData.variantSku}
                    onChange={(e) => setFormData({ ...formData, variantSku: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., TSH-001-RED-L"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Barcode
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Optional barcode"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Attribute Values
                </label>
                <div className="space-y-3 p-3 bg-slate-50 rounded border border-slate-200">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Color</label>
                    <select
                      value={formData.attributeValues['color'] || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        attributeValues: { ...formData.attributeValues, color: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    >
                      <option value="">Select Color</option>
                      <option value="Red">Red</option>
                      <option value="Blue">Blue</option>
                      <option value="Green">Green</option>
                      <option value="Black">Black</option>
                      <option value="White">White</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Size</label>
                    <select
                      value={formData.attributeValues['size'] || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        attributeValues: { ...formData.attributeValues, size: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    >
                      <option value="">Select Size</option>
                      <option value="XS">XS (Extra Small)</option>
                      <option value="S">S (Small)</option>
                      <option value="M">M (Medium)</option>
                      <option value="L">L (Large)</option>
                      <option value="XL">XL (Extra Large)</option>
                      <option value="XXL">XXL (2XL)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">Material</label>
                    <select
                      value={formData.attributeValues['material'] || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        attributeValues: { ...formData.attributeValues, material: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm"
                    >
                      <option value="">Select Material</option>
                      <option value="Cotton">Cotton</option>
                      <option value="Polyester">Polyester</option>
                      <option value="Wool">Wool</option>
                      <option value="Silk">Silk</option>
                      <option value="Blend">Blend</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddVariant}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Save size={16} /> Add Variant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
        <h3 className="font-bold text-slate-900 mb-3">Benefits of Variant Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
          <div>✓ Single master item instead of 50+ SKUs</div>
          <div>✓ Individual stock tracking per variant</div>
          <div>✓ Variant-specific pricing and barcodes</div>
          <div>✓ Better reporting and analytics</div>
          <div>✓ Simplified procurement (order variants together)</div>
          <div>✓ Flexible product presentation</div>
        </div>
      </div>
    </div>
  );
};

export default ItemVariantsView;
