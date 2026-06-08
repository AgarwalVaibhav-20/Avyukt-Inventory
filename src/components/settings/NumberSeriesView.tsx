import React, { useState, useEffect } from 'react';
import { settingsService } from '@/services/settingsService';
import { NumberSeries } from '@/types';
import { Hash, Save, Loader2 } from 'lucide-react';

const NumberSeriesView: React.FC = () => {
  const [series, setSeries] = useState<NumberSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<NumberSeries>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await settingsService.getNumberSeries();
    setSeries(data);
    setLoading(false);
  };

  const handleEdit = (s: NumberSeries) => {
      setEditingId(s.id);
      setEditValues(s);
  };

  const handleSave = async () => {
      if(!editingId) return;
      await settingsService.updateNumberSeries(editValues as NumberSeries);
      setEditingId(null);
      loadData();
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Hash className="text-purple-600" size={20}/> Document Number Series
            </h2>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Document Type</th>
                            <th className="px-6 py-4">Prefix</th>
                            <th className="px-6 py-4">Start Number</th>
                            <th className="px-6 py-4">Current Number</th>
                            <th className="px-6 py-4">Suffix</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="animate-spin-slow inline"/></td></tr> : 
                         series.map(s => {
                             const isEditing = editingId === s.id;
                             return (
                                <tr key={s.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-bold text-slate-700">{s.documentType}</td>
                                    <td className="px-6 py-4">
                                        {isEditing ? <input className="w-20 border rounded px-2 py-1" value={editValues.prefix} onChange={e => setEditValues({...editValues, prefix: e.target.value})}/> : s.prefix}
                                    </td>
                                    <td className="px-6 py-4">
                                        {isEditing ? <input type="number" className="w-20 border rounded px-2 py-1" value={editValues.startNumber} onChange={e => setEditValues({...editValues, startNumber: Number(e.target.value)})}/> : s.startNumber}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{s.currentNumber}</td>
                                    <td className="px-6 py-4">
                                        {isEditing ? <input className="w-20 border rounded px-2 py-1" value={editValues.suffix || ''} onChange={e => setEditValues({...editValues, suffix: e.target.value})}/> : s.suffix || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {isEditing ? (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={handleSave} className="text-green-600 hover:bg-green-50 p-1 rounded"><Save size={16}/></button>
                                                <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-100 p-1 rounded">Cancel</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => handleEdit(s)} className="text-blue-600 hover:underline text-xs">Edit</button>
                                        )}
                                    </td>
                                </tr>
                             );
                         })}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default NumberSeriesView;
