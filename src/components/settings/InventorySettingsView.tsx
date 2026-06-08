import React, { useState, useEffect } from 'react';
import { settingsService } from '@/services/settingsService';
import { warehouseService } from '@/services/warehouseService';
import { InventorySettings, Warehouse } from '@/types';
import { Settings, Save, Loader2 } from 'lucide-react';

const InventorySettingsView: React.FC = () => {
  const [settings, setSettings] = useState<InventorySettings | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [sData, wData] = await Promise.all([
        settingsService.getSettings(),
        warehouseService.getAllWarehouses()
    ]);
    setSettings(sData);
    setWarehouses(wData);
    setLoading(false);
  };

  const handleSave = async () => {
      if(!settings) return;
      setSaving(true);
      await settingsService.updateSettings(settings);
      setSaving(false);
      alert("Settings updated successfully!");
  };

  if (loading || !settings) return <div className="text-center py-8"><Loader2 className="animate-spin-slow inline"/></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Settings className="text-blue-600" size={20}/> General Inventory Settings
            </h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                    <input 
                        type="text" 
                        className="w-full border rounded-lg p-2 text-sm"
                        value={settings.companyName}
                        onChange={e => setSettings({...settings, companyName: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Base Currency</label>
                        <select 
                            className="w-full border rounded-lg p-2 text-sm"
                            value={settings.currency}
                            onChange={e => setSettings({...settings, currency: e.target.value})}
                        >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="INR">INR (₹)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Date Format</label>
                        <select 
                            className="w-full border rounded-lg p-2 text-sm"
                            value={settings.dateFormat}
                            onChange={e => setSettings({...settings, dateFormat: e.target.value})}
                        >
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Default Warehouse</label>
                    <select 
                        className="w-full border rounded-lg p-2 text-sm"
                        value={settings.defaultWarehouseId}
                        onChange={e => setSettings({...settings, defaultWarehouseId: e.target.value})}
                    >
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                </div>

                <div className="space-y-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={settings.allowNegativeStock}
                            onChange={e => setSettings({...settings, allowNegativeStock: e.target.checked})}
                        />
                        <span className="text-sm text-slate-700">Allow Negative Stock</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={settings.enableBatchTracking}
                            onChange={e => setSettings({...settings, enableBatchTracking: e.target.checked})}
                        />
                        <span className="text-sm text-slate-700">Enable Batch Tracking</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            checked={settings.enableSerialTracking}
                            onChange={e => setSettings({...settings, enableSerialTracking: e.target.checked})}
                        />
                        <span className="text-sm text-slate-700">Enable Serial Number Tracking</span>
                    </label>
                </div>

                <div className="flex justify-end pt-4">
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="animate-spin-slow" size={16}/> : <Save size={16}/>}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default InventorySettingsView;
