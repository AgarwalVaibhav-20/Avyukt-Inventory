import React, { useState, useEffect } from 'react';
import { Settings, ChevronRight, Search, Filter, X, Grid, Sliders, Zap, Hash, LayoutGrid, Workflow } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import InventorySettingsView from './InventorySettingsView';
import AutoReorderRulesView from './AutoReorderRulesView';
import TaxConfigurationView from './TaxConfigurationView';
import NumberSeriesView from './NumberSeriesView';
import CustomFieldsView from './CustomFieldsView';
import WorkflowRulesView from './WorkflowRulesView';

type SettingsTab = 'inventory' | 'autoreorder' | 'tax' | 'number' | 'custom' | 'workflow';

interface SettingsFilters {
  settingCategory: string;
  searchSetting: string;
  modifiedBy: string;
  modifiedDateFrom: string;
  modifiedDateTo: string;
  warehouseSpecific: boolean;
  autoReorderStatus: string;
  workflowModule: string;
  numberSeriesType: string;
}

interface SettingsViewProps {
  defaultTab?: SettingsTab;
}

const SettingsView: React.FC<SettingsViewProps> = ({ defaultTab = 'inventory' }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab);

  // Map URL paths to tabs
  useEffect(() => {
    const pathMap: Record<string, SettingsTab> = {
      'set-inv': 'inventory',
      'set-rule': 'autoreorder',
      'set-tax': 'tax',
      'set-num': 'number',
      'set-field': 'custom',
      'set-flow': 'workflow',
    };

    const lastSegment = location.pathname.split('/').pop();
    if (lastSegment && pathMap[lastSegment]) {
      setActiveTab(pathMap[lastSegment]);
    } else {
      setActiveTab(defaultTab);
    }
  }, [location.pathname, defaultTab]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SettingsFilters>({
    settingCategory: 'all',
    searchSetting: '',
    modifiedBy: 'all',
    modifiedDateFrom: '',
    modifiedDateTo: '',
    warehouseSpecific: false,
    autoReorderStatus: 'all',
    workflowModule: 'all',
    numberSeriesType: 'all',
  });

  const settingsTabs = [
    { id: 'inventory', label: 'Inventory Settings', icon: Grid, color: 'from-blue-600 to-blue-700', description: 'Global configuration: Allow/Disallow negative stock, default valuation method, stock posting timing (real-time vs. batch), default warehouse, item code format, UOM enforcement, and decimal precision for quantities.' },
    { id: 'autoreorder', label: 'Auto Reorder Rules', icon: Zap, color: 'from-amber-600 to-amber-700', description: 'Configures the automated replenishment engine: which items trigger automatic PO creation, when (at reorder point or safety stock breach), how much to order (EOQ formula or fixed quantity), and which vendor to use.' },
    { id: 'tax', label: 'Tax & GST Configuration', icon: Sliders, color: 'from-emerald-600 to-emerald-700', description: 'Set up GST rate slabs, HSN-code-to-tax-rate mapping, CGST/SGST/IGST applicability rules, reverse charge items, and GST registration details for each warehouse/plant location.' },
    { id: 'number', label: 'Number Series', icon: Hash, color: 'from-purple-600 to-purple-700', description: 'Define auto-numbering formats and sequences for every document type. PO/2025-26/00001, GRN/W1/2025/00001, etc. Supports prefix/suffix, fiscal year reset, and warehouse-specific series.' },
    { id: 'custom', label: 'Custom Fields', icon: LayoutGrid, color: 'from-pink-600 to-pink-700', description: 'Allows administrators to add custom data fields to any module\'s forms without code changes - text fields, dropdowns, dates, checkboxes. These appear in forms, reports, and exports.' },
    { id: 'workflow', label: 'Workflow Rules', icon: Workflow, color: 'from-indigo-600 to-indigo-700', description: 'Configure event-driven automation: send email notification when stock goes below reorder level, auto-assign inspector when GRN created, escalate approval if pending >24 hours, etc.' },
  ];

  const handleFilterChange = (key: keyof SettingsFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      settingCategory: 'all',
      searchSetting: '',
      modifiedBy: 'all',
      modifiedDateFrom: '',
      modifiedDateTo: '',
      warehouseSpecific: false,
      autoReorderStatus: 'all',
      workflowModule: 'all',
      numberSeriesType: 'all',
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'inventory':
        return <InventorySettingsView />;
      case 'autoreorder':
        return <AutoReorderRulesView />;
      case 'tax':
        return <TaxConfigurationView />;
      case 'number':
        return <NumberSeriesView />;
      case 'custom':
        return <CustomFieldsView />;
      case 'workflow':
        return <WorkflowRulesView />;
      default:
        return <InventorySettingsView />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-950 to-slate-900 text-white p-6 shadow-lg border-b-2 border-blue-600">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-600 rounded-lg p-2">
            <Settings size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold"> <span className="text-blue-400">SETTINGS</span></h1>
        </div>
        <p className="text-slate-300 text-sm">Central configuration hub for all system-wide rules, defaults, numbering conventions, and automation parameters that govern how the inventory system behaves.</p>
      </div>

      {/* Filters Section */}
      <div className="bg-white border-b-2 border-slate-200 shadow-sm">
        <div className="px-8 py-5">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-slate-700 hover:text-blue-600 font-semibold mb-4 transition-colors group"
          >
            <Filter size={20} className="group-hover:text-blue-600" />
            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            {Object.values(filters).some(v => v !== 'all' && v !== '' && v !== false) && (
              <span className="ml-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-md">
                {Object.values(filters).filter(v => v !== 'all' && v !== '' && v !== false).length} Active
              </span>
            )}
          </button>

          {showFilters && (
            <div className="space-y-5 mt-6 border-t-2 border-slate-100 pt-5">
              {/* Row 1: Basic Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Setting Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Setting Category</label>
                  <select
                    value={filters.settingCategory}
                    onChange={(e) => handleFilterChange('settingCategory', e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-slate-300"
                  >
                    <option value="all">All Categories</option>
                    <option value="general">General</option>
                    <option value="procurement">Procurement</option>
                    <option value="inventory">Inventory</option>
                    <option value="valuation">Valuation</option>
                    <option value="gst">GST</option>
                    <option value="notifications">Notifications</option>
                    <option value="integrations">Integrations</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                {/* Search Setting */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Search Setting</label>
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-2.5 text-blue-400" />
                    <input
                      type="text"
                      placeholder="Setting name or keyword"
                      value={filters.searchSetting}
                      onChange={(e) => handleFilterChange('searchSetting', e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-slate-300"
                    />
                  </div>
                </div>

                {/* Modified By */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Modified By</label>
                  <select
                    value={filters.modifiedBy}
                    onChange={(e) => handleFilterChange('modifiedBy', e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-slate-300"
                  >
                    <option value="all">Admin user who changed the setting</option>
                    <option value="system">System</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                {/* Modified Date Range */}
                <div className="md:col-span-1 flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Date From</label>
                    <input
                      type="date"
                      value={filters.modifiedDateFrom}
                      onChange={(e) => handleFilterChange('modifiedDateFrom', e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-slate-300"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">To</label>
                    <input
                      type="date"
                      value={filters.modifiedDateTo}
                      onChange={(e) => handleFilterChange('modifiedDateTo', e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Advanced Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t-2 border-slate-100">
                {/* Warehouse-specific Toggle */}
                <div className="flex items-center gap-4 md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.warehouseSpecific}
                      onChange={(e) => handleFilterChange('warehouseSpecific', e.target.checked)}
                      className="w-5 h-5 border-2 border-slate-300 rounded-md text-blue-600 focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">Warehouse-specific overrides only</span>
                  </label>
                  <span className="text-xs text-slate-500">Show global / Warehouse-specific / All</span>
                </div>

                {/* Auto-Reorder Rule Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Auto-Reorder Rule Status</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFilterChange('autoReorderStatus', 'active')}
                      className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                        filters.autoReorderStatus === 'active'
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => handleFilterChange('autoReorderStatus', 'inactive')}
                      className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                        filters.autoReorderStatus === 'inactive'
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Inactive
                    </button>
                    <button
                      onClick={() => handleFilterChange('autoReorderStatus', 'all')}
                      className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                        filters.autoReorderStatus === 'all'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All
                    </button>
                  </div>
                </div>

                {/* Workflow Rules - Module */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Workflow Rules - Module</label>
                  <select
                    value={filters.workflowModule}
                    onChange={(e) => handleFilterChange('workflowModule', e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-slate-300"
                  >
                    <option value="all">Which module the workflow rule applies to</option>
                    <option value="inward">Inward</option>
                    <option value="outward">Outward</option>
                    <option value="movement">Movement</option>
                    <option value="quality">Quality</option>
                  </select>
                </div>

                {/* Number Series - Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Number Series - Type</label>
                  <select
                    value={filters.numberSeriesType}
                    onChange={(e) => handleFilterChange('numberSeriesType', e.target.value)}
                    className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-slate-300"
                  >
                    <option value="all">Number series configuration for specific document types</option>
                    <option value="po">Purchase Order (PO)</option>
                    <option value="grn">Goods Received Note (GRN)</option>
                    <option value="challan">Challan</option>
                    <option value="invoice">Invoice</option>
                    <option value="transfer">Transfer</option>
                    <option value="adjustment">Adjustment</option>
                  </select>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t-2 border-slate-100">
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-2 px-6 py-2.5 border-2 border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
                >
                  <X size={18} />
                  Reset Filters
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Menu Navigation */}
      <div className="bg-gradient-to-b from-slate-100 to-slate-50 px-8 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Configuration Sections</h2>
          <p className="text-slate-600 text-sm">Select a section below to configure system-wide settings</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`group text-left p-6 rounded-2xl transition-all transform hover:scale-105 ${
                  isActive
                    ? `bg-gradient-to-br ${tab.color} text-white shadow-xl border-2 border-white`
                    : 'bg-white text-slate-900 shadow-md hover:shadow-lg border-2 border-transparent'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                  } transition-all`}>
                    <Icon size={24} />
                  </div>
                  <ChevronRight size={20} className={`transition-transform ${isActive ? 'translate-x-1 text-white' : 'text-slate-400'}`} />
                </div>
                <h3 className={`font-bold text-lg mb-2 ${isActive ? 'text-white' : 'text-slate-900'}`}>
                  {tab.label}
                </h3>
                <p className={`text-xs leading-relaxed ${
                  isActive ? 'text-blue-100' : 'text-slate-600 group-hover:text-slate-700'
                }`}>
                  {tab.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="px-8 py-12 bg-white">
        {renderContent()}
      </div>
    </div>
  );
};

export default SettingsView;
