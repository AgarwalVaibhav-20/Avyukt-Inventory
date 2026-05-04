import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { UOM } from '../types';
import { Plus, Edit2, Trash2, Search, Loader2, Save, X, ArrowRight } from 'lucide-react';

const UnitOfMeasureView: React.FC = () => {
  const [uoms, setUoms] = useState<UOM[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    symbol: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await productService.getUOMs();
      setUoms(data);
    } catch (error) {
      console.error('Failed to load UOMs', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUOM = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      alert('UOM Name and Code are required');
      return;
    }

    try {
      await productService.addUOM({
        name: formData.name,
        code: formData.code,
        symbol: formData.symbol,
        isActive: true,
      });
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save UOM', error);
      alert('Failed to save UOM');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this UOM?')) {
      try {
        await productService.deleteUOM(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete UOM', error);
        alert('Failed to delete UOM');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      symbol: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredUoms = uoms.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Unit of Measure (UoM)</h2>
          <p className="text-sm text-slate-500">Manage measurement units and conversions</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={18} /> Add UoM
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-4">
          <div className="text-3xl font-bold text-purple-600">{filteredUoms.length}</div>
          <div className="text-sm text-slate-600">Units of Measure</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-4">
          <div className="text-3xl font-bold text-blue-600">
            {uoms.filter(u => u.conversionTable?.length).length}
          </div>
          <div className="text-sm text-slate-600">With Conversions</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4">
          <div className="text-3xl font-bold text-green-600">
            {uoms.filter(u => u.isActive).length}
          </div>
          <div className="text-sm text-slate-600">Active UoMs</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search units or codes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">
              {editingId ? 'Edit Unit of Measure' : 'Add New Unit of Measure'}
            </h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                UoM Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Kilogram"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., kg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Symbol
              </label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., kg"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <strong>Tip:</strong> Create base units first (e.g., Piece, Kilogram), then set up conversions between them.
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveUOM}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Save size={16} /> Save UoM
            </button>
          </div>
        </div>
      )}

      {/* UoMs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="animate-spin inline mr-2" />
            Loading units...
          </div>
        ) : filteredUoms.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            {search ? 'No units found matching your search.' : 'No units yet. Create one to get started.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Symbol</th>
                  <th className="px-6 py-4">Conversions</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUoms.map(uom => (
                  <tr key={uom.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{uom.name}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                        {uom.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{uom.symbol || '-'}</td>
                    <td className="px-6 py-4">
                      {uom.conversionTable && uom.conversionTable.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {uom.conversionTable.slice(0, 2).map((conv, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200"
                            >
                              {conv.conversionFactor}:1
                            </span>
                          ))}
                          {uom.conversionTable.length > 2 && (
                            <span className="text-xs bg-slate-50 text-slate-700 px-2 py-1 rounded">
                              +{uom.conversionTable.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${
                          uom.isActive
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {uom.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingId(uom.id);
                            setFormData({
                              name: uom.name,
                              code: uom.code,
                              symbol: uom.symbol || '',
                            });
                            setShowForm(true);
                          }}
                          className="text-blue-600 hover:bg-blue-50 p-1 rounded transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(uom.id)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Conversion Examples Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-900 mb-4">Common Conversion Examples</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { from: '1 Carton', to: '12 Boxes', factor: '12' },
            { from: '1 Box', to: '144 Pieces', factor: '144' },
            { from: '1 KG', to: '1000 Grams', factor: '1000' },
            { from: '1 Liter', to: '1000 ML', factor: '1000' },
            { from: '1 Meter', to: '100 Centimeters', factor: '100' },
            { from: '1 Dozen', to: '12 Pieces', factor: '12' },
          ].map((example, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-blue-100">
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-900">{example.from}</div>
              </div>
              <ArrowRight className="text-blue-500" size={16} />
              <div className="flex-1 text-right">
                <div className="text-sm font-medium text-slate-900">{example.to}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UnitOfMeasureView;
