import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { Category } from '../types';
import { Plus, Edit2, Trash2, Search, ChevronDown, ChevronRight, Loader2, Save, X } from 'lucide-react';

const ItemCategoriesView: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentCategoryId: '',
    code: '',
    valuationMethod: 'FIFO' as const,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await productService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!formData.name.trim()) {
      alert('Category name is required');
      return;
    }

    try {
      await productService.addCategory({
        name: formData.name,
        description: formData.description,
        parentCategoryId: formData.parentCategoryId || undefined,
        code: formData.code,
        valuationMethod: formData.valuationMethod,
        isActive: true,
      });
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to add category', error);
      alert('Failed to add category');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        await productService.deleteCategory(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete category', error);
        alert('Failed to delete category');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parentCategoryId: '',
      code: '',
      valuationMethod: 'FIFO',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const getParentCategory = (parentId: string) => {
    return categories.find(c => c.id === parentId);
  };

  const getSubCategories = (parentId: string) => {
    return categories.filter(c => c.parentCategoryId === parentId);
  };

  const filteredCategories = categories.filter(c => 
    !c.parentCategoryId && (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase()) ||
      c.code?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const renderCategoryTree = (category: Category, level = 0) => {
    const subCategories = getSubCategories(category.id);
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id}>
        <div className={`flex items-center gap-2 p-3 hover:bg-slate-50 border-b border-slate-100 ${level > 0 ? 'ml-' + (level * 4) : ''}`}>
          {subCategories.length > 0 && (
            <button
              onClick={() => toggleExpanded(category.id)}
              className="p-1 hover:bg-slate-200 rounded"
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          {subCategories.length === 0 && <div className="w-6" />}

          <div className="flex-1">
            <div className="font-medium text-slate-900">{category.name}</div>
            {category.code && <div className="text-xs text-slate-500">Code: {category.code}</div>}
            {category.description && <div className="text-sm text-slate-600">{category.description}</div>}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
              {category.valuationMethod}
            </span>
            <button
              onClick={() => {
                setEditingId(category.id);
                setFormData({
                  name: category.name,
                  description: category.description,
                  parentCategoryId: category.parentCategoryId || '',
                  code: category.code || '',
                  valuationMethod: category.valuationMethod || 'FIFO',
                });
                setShowForm(true);
              }}
              className="text-blue-600 hover:bg-blue-50 p-1 rounded"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => handleDelete(category.id)}
              className="text-red-600 hover:bg-red-50 p-1 rounded"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {isExpanded && subCategories.map(subCategory => renderCategoryTree(subCategory, level + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Item Categories</h2>
          <p className="text-sm text-slate-500">Manage product categories and hierarchies</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={18} /> Add Category
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">
              {editingId ? 'Edit Category' : 'Add New Category'}
            </h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Electronics"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category Code
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., ELEC"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Category description..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Parent Category
              </label>
              <select
                value={formData.parentCategoryId}
                onChange={(e) => setFormData({ ...formData, parentCategoryId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- No Parent --</option>
                {categories
                  .filter(c => c.id !== editingId && !c.parentCategoryId)
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Valuation Method
              </label>
              <select
                value={formData.valuationMethod}
                onChange={(e) => setFormData({ ...formData, valuationMethod: e.target.value as any })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="FIFO">FIFO</option>
                <option value="LIFO">LIFO</option>
                <option value="Weighted Average">Weighted Average</option>
                <option value="Standard Cost">Standard Cost</option>
              </select>
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
              onClick={handleAddCategory}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save size={16} /> Save Category
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="animate-spin inline mr-2" />
            Loading categories...
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            {search ? 'No categories found matching your search.' : 'No categories yet. Create one to get started.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredCategories.map(category => renderCategoryTree(category))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemCategoriesView;
