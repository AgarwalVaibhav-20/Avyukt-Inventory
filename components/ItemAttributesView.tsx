import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { Attribute } from '../types';
import { Plus, Edit2, Trash2, Search, Loader2, Save, X, Tag, Layers } from 'lucide-react';

const ItemAttributesView: React.FC = () => {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dataType: 'Dropdown' as const,
    values: '' as any, // Store as comma-separated string in form
    isRequired: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await productService.getAttributes();
      setAttributes(data);
    } catch (error) {
      console.error('Failed to load attributes', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAttribute = async () => {
    if (!formData.name.trim()) {
      alert('Attribute name is required');
      return;
    }

    try {
      const valuesArray = formData.dataType === 'Dropdown' || formData.dataType === 'Checkbox'
        ? formData.values.split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0)
        : [];

      if ((formData.dataType === 'Dropdown' || formData.dataType === 'Checkbox') && valuesArray.length === 0) {
        alert('Please provide at least one value for dropdown/checkbox attributes');
        return;
      }

      await productService.addAttribute({
        name: formData.name,
        description: formData.description,
        values: valuesArray,
        dataType: formData.dataType,
        isRequired: formData.isRequired,
        isActive: true,
      });
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save attribute', error);
      alert('Failed to save attribute');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this attribute?')) {
      try {
        await productService.deleteAttribute(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete attribute', error);
        alert('Failed to delete attribute');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      dataType: 'Dropdown',
      values: '',
      isRequired: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredAttributes = attributes.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Item Attributes</h2>
          <p className="text-sm text-slate-500">Create custom attributes for detailed product classification and filtering</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={18} /> Add Attribute
        </button>
      </div>

      {/* Example Attributes */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex gap-2 mb-3">
          <Layers className="text-indigo-600" size={18} />
          <h3 className="font-medium text-indigo-900">Common Attribute Examples</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {['Color', 'Size', 'Material', 'Grade', 'Weight', 'Voltage', 'Finish', 'Brand'].map((attr, idx) => (
            <div key={idx} className="bg-white rounded px-2 py-1 border border-indigo-200">
              <Tag size={12} className="inline mr-1 text-indigo-500" />
              {attr}
            </div>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search attributes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">
              {editingId ? 'Edit Attribute' : 'Add New Attribute'}
            </h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Attribute Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Color"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Describe this attribute..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Data Type *
                </label>
                <select
                  value={formData.dataType}
                  onChange={(e) => setFormData({ ...formData, dataType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Text">Text</option>
                  <option value="Number">Number</option>
                  <option value="Date">Date</option>
                  <option value="Dropdown">Dropdown</option>
                  <option value="Checkbox">Checkbox (Multi-select)</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 w-full px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isRequired}
                    onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700">Required</span>
                </label>
              </div>
            </div>

            {(formData.dataType === 'Dropdown' || formData.dataType === 'Checkbox') && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Values (comma-separated) *
                </label>
                <textarea
                  value={formData.values}
                  onChange={(e) => setFormData({ ...formData, values: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Red, Blue, Green, Black, White"
                  rows={3}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Enter each value on a new line or separated by commas
                </p>
              </div>
            )}

            {formData.dataType === 'Number' && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                Number attributes can be used for filtering by ranges (e.g., weight, voltage, dimensions)
              </div>
            )}

            {formData.dataType === 'Date' && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                Date attributes can store temporal values (e.g., manufacturing date, expiry date)
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAttribute}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Save size={16} /> Save Attribute
            </button>
          </div>
        </div>
      )}

      {/* Attributes Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="animate-spin inline mr-2" />
            Loading attributes...
          </div>
        ) : filteredAttributes.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            {search ? 'No attributes found matching your search.' : 'No attributes yet. Create one to get started.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Attribute Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Values</th>
                  <th className="px-6 py-4">Required</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttributes.map(attr => (
                  <tr key={attr.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{attr.name}</div>
                      {attr.description && (
                        <div className="text-xs text-slate-500">{attr.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium border border-slate-200 bg-slate-50 text-slate-700">
                        {attr.dataType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {attr.values && attr.values.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {attr.values.slice(0, 3).map((val, idx) => (
                            <span key={idx} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-200">
                              {val}
                            </span>
                          ))}
                          {attr.values.length > 3 && (
                            <span className="text-xs bg-slate-50 text-slate-700 px-2 py-1 rounded">
                              +{attr.values.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-medium ${
                          attr.isRequired ? 'text-red-600' : 'text-slate-500'
                        }`}
                      >
                        {attr.isRequired ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${
                          attr.isActive
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {attr.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingId(attr.id);
                            setFormData({
                              name: attr.name,
                              description: attr.description || '',
                              dataType: attr.dataType,
                              values: attr.values?.join(', ') || '',
                              isRequired: attr.isRequired,
                            });
                            setShowForm(true);
                          }}
                          className="text-blue-600 hover:bg-blue-50 p-1 rounded transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(attr.id)}
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

      {/* Usage Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 shadow-sm p-4">
          <h3 className="font-bold text-slate-900 mb-2">Benefits</h3>
          <ul className="text-sm text-slate-700 space-y-1">
            <li>✓ Avoid database schema changes</li>
            <li>✓ Flexible product classification</li>
            <li>✓ Dynamic filtering in searches</li>
            <li>✓ Better reporting capabilities</li>
          </ul>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 shadow-sm p-4">
          <h3 className="font-bold text-slate-900 mb-2">Typical Use Cases</h3>
          <ul className="text-sm text-slate-700 space-y-1">
            <li>✓ Variants (Size, Color, Material)</li>
            <li>✓ Quality specs (Grade, Weight Class)</li>
            <li>✓ Technical properties (Voltage, Capacity)</li>
            <li>✓ Certifications & Standards</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ItemAttributesView;
