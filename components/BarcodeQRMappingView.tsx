import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { InventoryItem } from '../types';
import { Plus, Edit2, Trash2, Search, Loader2, Save, X, Barcode, QrCode, Copy, RefreshCw } from 'lucide-react';

const BarcodeQRMappingView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [barcodeType, setBarcodeType] = useState<'EAN-13' | 'Code128' | 'QR'>('Code128');
  const [formData, setFormData] = useState({
    barcodeValue: '',
    type: 'Code128' as const,
    isPrimary: true,
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

  const generateBarcode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let barcode = '';
    for (let i = 0; i < 12; i++) {
      barcode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, barcodeValue: barcode });
  };

  const handleSaveBarcode = async (itemId: string) => {
    if (!formData.barcodeValue.trim()) {
      alert('Barcode value is required');
      return;
    }

    try {
      await productService.updateBarcode(itemId, formData.barcodeValue);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save barcode', error);
      alert('Failed to save barcode');
    }
  };

  const resetForm = () => {
    setFormData({
      barcodeValue: '',
      type: 'Code128',
      isPrimary: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.sku.toLowerCase().includes(search.toLowerCase()) ||
    i.barcode?.toLowerCase().includes(search.toLowerCase())
  );

  const barcodeStats = {
    withBarcode: items.filter(i => i.barcode && i.barcode.length > 0).length,
    withoutBarcode: items.filter(i => !i.barcode || i.barcode.length === 0).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Barcode / QR Code Mapping</h2>
          <p className="text-sm text-slate-500">Link barcodes and QR codes to items for fast identification</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-4">
          <div className="text-3xl font-bold text-blue-600">{items.length}</div>
          <div className="text-sm text-slate-600">Total Items</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4">
          <div className="text-3xl font-bold text-green-600">{barcodeStats.withBarcode}</div>
          <div className="text-sm text-slate-600">With Barcode</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-200 p-4">
          <div className="text-3xl font-bold text-orange-600">{barcodeStats.withoutBarcode}</div>
          <div className="text-sm text-slate-600">Needs Barcode</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-4">
          <div className="text-3xl font-bold text-purple-600">
            {((barcodeStats.withBarcode / items.length) * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-slate-600">Coverage</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search by item name, SKU, or barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Barcode Types Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg border border-red-200 p-4">
          <div className="flex gap-2 mb-2">
            <Barcode className="text-red-600" size={18} />
            <h3 className="font-bold text-slate-900">EAN-13</h3>
          </div>
          <p className="text-sm text-slate-700">International standard barcode, 13 digits. Best for retail products.</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-4">
          <div className="flex gap-2 mb-2">
            <Barcode className="text-blue-600" size={18} />
            <h3 className="font-bold text-slate-900">Code128</h3>
          </div>
          <p className="text-sm text-slate-700">Flexible 1D barcode supporting alphanumeric characters. Good for warehouses.</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-4">
          <div className="flex gap-2 mb-2">
            <QrCode className="text-purple-600" size={18} />
            <h3 className="font-bold text-slate-900">QR Code</h3>
          </div>
          <p className="text-sm text-slate-700">2D code with high capacity. Can store URLs, SKUs, and batch details.</p>
        </div>
      </div>

      {/* Items Table */}
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
                  <th className="px-6 py-4">Barcode Status</th>
                  <th className="px-6 py-4">Barcode Value</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                        {item.sku}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.barcode && item.barcode.length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          <Barcode size={12} /> Assigned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                          <AlertCircle size={12} /> Missing
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.barcode ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm bg-blue-50 px-2 py-1 rounded border border-blue-200">
                            {item.barcode}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.barcode);
                              alert('Barcode copied!');
                            }}
                            className="text-slate-400 hover:text-blue-600 p-1"
                            title="Copy barcode"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setEditingId(item.id);
                          setFormData({
                            barcodeValue: item.barcode || '',
                            type: 'Code128',
                            isPrimary: true,
                          });
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:bg-blue-50 p-1 rounded inline-flex items-center gap-1"
                      >
                        <Edit2 size={16} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Barcode Form Modal */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 space-y-4 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 max-w-full z-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Assign Barcode</h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Barcode Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Code128">Code128 (Alphanumeric)</option>
                <option value="EAN-13">EAN-13 (Retail)</option>
                <option value="QR">QR Code (2D)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Barcode Value
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.barcodeValue}
                  onChange={(e) => setFormData({ ...formData, barcodeValue: e.target.value })}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter or generate barcode"
                />
                <button
                  onClick={generateBarcode}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 flex items-center gap-1"
                >
                  <RefreshCw size={16} /> Generate
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 p-2 border border-slate-300 rounded-lg hover:bg-slate-50">
              <input
                type="checkbox"
                checked={formData.isPrimary}
                onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">Set as Primary Barcode</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (editingId) handleSaveBarcode(editingId);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save size={16} /> Save Barcode
            </button>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-slate-900 mb-2">Best Practices for Barcode Mapping</h3>
        <ul className="text-sm text-slate-700 space-y-1">
          <li>✓ Use manufacturer barcodes where available for external traceability</li>
          <li>✓ Generate internal codes for items without manufacturer barcodes</li>
          <li>✓ Map multiple barcodes to items sold through different channels</li>
          <li>✓ Support variant-level barcoding for size/color variations</li>
          <li>✓ Maintain barcode history for audit and recall management</li>
        </ul>
      </div>
    </div>
  );
};

export default BarcodeQRMappingView;

// Helper icon component
const AlertCircle = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
