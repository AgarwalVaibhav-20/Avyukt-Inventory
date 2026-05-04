import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { Brand } from '../types';
import { Plus, Edit2, Trash2, Search, Loader2, Save, X, Globe, Mail, Phone } from 'lucide-react';

const BrandMasterView: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    description: '',
    website: '',
    contactPerson: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await productService.getBrands();
      setBrands(data);
    } catch (error) {
      console.error('Failed to load brands', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBrand = async () => {
    if (!formData.name.trim() || !formData.manufacturer.trim()) {
      alert('Brand Name and Manufacturer are required');
      return;
    }

    try {
      await productService.addBrand({
        name: formData.name,
        manufacturer: formData.manufacturer,
        description: formData.description,
        website: formData.website,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        isActive: true,
      });
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save brand', error);
      alert('Failed to save brand');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this brand?')) {
      try {
        await productService.deleteBrand(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete brand', error);
        alert('Failed to delete brand');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      manufacturer: '',
      description: '',
      website: '',
      contactPerson: '',
      email: '',
      phone: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredBrands = brands.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.manufacturer.toLowerCase().includes(search.toLowerCase()) ||
    b.contactPerson?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Brand Master</h2>
          <p className="text-sm text-slate-500">Manage all brand and manufacturer information</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={18} /> Add Brand
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search brands, manufacturers, or contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">
              {editingId ? 'Edit Brand' : 'Add New Brand'}
            </h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Brand Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Sony"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Manufacturer *
              </label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Sony Corporation"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Brand description..."
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Contact person name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="contact@brand.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="https://www.brand.com"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveBrand}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save size={16} /> Save Brand
            </button>
          </div>
        </div>
      )}

      {/* Brands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center">
            <Loader2 className="animate-spin inline mr-2" />
            Loading brands...
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            {search ? 'No brands found matching your search.' : 'No brands yet. Create one to get started.'}
          </div>
        ) : (
          filteredBrands.map(brand => (
            <div key={brand.id} className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-slate-900">{brand.name}</h3>
                  <p className="text-sm text-slate-600">{brand.manufacturer}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingId(brand.id);
                      setFormData({
                        name: brand.name,
                        manufacturer: brand.manufacturer,
                        description: brand.description || '',
                        website: brand.website || '',
                        contactPerson: brand.contactPerson || '',
                        email: brand.email || '',
                        phone: brand.phone || '',
                      });
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(brand.id)}
                    className="text-red-600 hover:bg-red-50 p-1 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {brand.description && (
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{brand.description}</p>
              )}

              <div className="space-y-2 text-sm">
                {brand.contactPerson && (
                  <div className="text-slate-600">
                    <span className="font-medium text-slate-700">Contact:</span> {brand.contactPerson}
                  </div>
                )}
                {brand.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail size={14} className="text-blue-500" />
                    <a href={`mailto:${brand.email}`} className="text-blue-600 hover:underline">
                      {brand.email}
                    </a>
                  </div>
                )}
                {brand.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone size={14} className="text-green-500" />
                    {brand.phone}
                  </div>
                )}
                {brand.website && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Globe size={14} className="text-purple-500" />
                    <a href={brand.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BrandMasterView;
