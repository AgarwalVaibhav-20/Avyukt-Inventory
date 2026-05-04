import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { HSN } from '../types';
import { Plus, Edit2, Trash2, Search, Loader2, Save, X, Percent, BookOpen } from 'lucide-react';

const HSNSACMasterView: React.FC = () => {
  const [hsns, setHsns] = useState<HSN[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    taxRate: 0,
    applicableForGoods: true,
    applicableForServices: false,
    section: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await productService.getHSN();
      setHsns(data);
    } catch (error) {
      console.error('Failed to load HSN', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHSN = async () => {
    if (!formData.code.trim() || !formData.description.trim()) {
      alert('HSN Code and Description are required');
      return;
    }

    try {
      await productService.addHSN({
        code: formData.code,
        description: formData.description,
        taxRate: formData.taxRate,
        applicableForGoods: formData.applicableForGoods,
        applicableForServices: formData.applicableForServices,
        section: formData.section,
        isActive: true,
      });
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save HSN', error);
      alert('Failed to save HSN');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this HSN code?')) {
      try {
        await productService.deleteHSN(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete HSN', error);
        alert('Failed to delete HSN');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      taxRate: 0,
      applicableForGoods: true,
      applicableForServices: false,
      section: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredHsns = hsns.filter(h =>
    h.code.toLowerCase().includes(search.toLowerCase()) ||
    h.description.toLowerCase().includes(search.toLowerCase())
  );

  const gstRateGroups = {
    '0%': filteredHsns.filter(h => h.taxRate === 0),
    '5%': filteredHsns.filter(h => h.taxRate === 5),
    '12%': filteredHsns.filter(h => h.taxRate === 12),
    '18%': filteredHsns.filter(h => h.taxRate === 18),
    '28%': filteredHsns.filter(h => h.taxRate === 28),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">HSN / SAC Master</h2>
          <p className="text-sm text-slate-500">Manage Harmonized System & Service Accounting Codes for GST compliance</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={18} /> Add HSN/SAC
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-200 p-4">
          <div className="text-3xl font-bold text-orange-600">{filteredHsns.length}</div>
          <div className="text-sm text-slate-600">Total Codes</div>
        </div>
        {Object.entries(gstRateGroups).map(([rate, items]) => items.length > 0 && (
          <div key={rate} className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-4">
            <div className="text-3xl font-bold text-blue-600">{items.length}</div>
            <div className="text-sm text-slate-600">GST {rate}</div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search HSN code or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">
              {editingId ? 'Edit HSN/SAC Code' : 'Add New HSN/SAC Code'}
            </h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                HSN/SAC Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., 8517.62"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                GST Rate (%) *
              </label>
              <select
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., Telephone sets"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Section/Chapter
              </label>
              <input
                type="text"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., Chapter 85"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="goods"
                  checked={formData.applicableForGoods}
                  onChange={(e) => setFormData({ ...formData, applicableForGoods: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <label htmlFor="goods" className="text-sm text-slate-700">Applicable for Goods</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="services"
                  checked={formData.applicableForServices}
                  onChange={(e) => setFormData({ ...formData, applicableForServices: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <label htmlFor="services" className="text-sm text-slate-700">Applicable for Services (SAC)</label>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <strong>Note:</strong> HSN codes are mandatory for GST invoice generation, E-Way Bills, and tax return filing (GSTR-1, GSTR-3B).
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveHSN}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Save size={16} /> Save Code
            </button>
          </div>
        </div>
      )}

      {/* HSN Codes Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="animate-spin inline mr-2" />
            Loading codes...
          </div>
        ) : filteredHsns.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            {search ? 'No HSN codes found matching your search.' : 'No HSN codes yet. Create one to get started.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">HSN/SAC Code</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Section</th>
                  <th className="px-6 py-4">GST Rate</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHsns.map(hsn => (
                  <tr key={hsn.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded font-medium">
                        {hsn.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-900">{hsn.description}</td>
                    <td className="px-6 py-4 text-slate-600">{hsn.section || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Percent size={14} className="text-blue-500" />
                        <span className="font-bold text-blue-600">{hsn.taxRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {hsn.applicableForGoods && (
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200">
                            Goods
                          </span>
                        )}
                        {hsn.applicableForServices && (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                            Services
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${
                          hsn.isActive
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {hsn.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingId(hsn.id);
                            setFormData({
                              code: hsn.code,
                              description: hsn.description,
                              taxRate: hsn.taxRate,
                              applicableForGoods: hsn.applicableForGoods,
                              applicableForServices: hsn.applicableForServices,
                              section: hsn.section || '',
                            });
                            setShowForm(true);
                          }}
                          className="text-blue-600 hover:bg-blue-50 p-1 rounded transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(hsn.id)}
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

      {/* Compliance Info */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 shadow-sm p-6">
        <div className="flex gap-4">
          <BookOpen className="text-orange-600 flex-shrink-0" size={24} />
          <div>
            <h3 className="font-bold text-slate-900 mb-2">GST Compliance Requirements</h3>
            <ul className="space-y-1 text-sm text-slate-700">
              <li>✓ All products must be mapped to valid HSN codes</li>
              <li>✓ HSN codes determine the applicable GST tax rate</li>
              <li>✓ Required for GST invoice generation and E-Way Bills</li>
              <li>✓ Used in GSTR-1 (outward supplies) and GSTR-3B (returns)</li>
              <li>✓ Different GST rates apply based on product category</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HSNSACMasterView;
