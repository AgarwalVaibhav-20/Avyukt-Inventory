import React, { useState, useEffect } from 'react';
import { qualityService } from '../services/qualityService';
import { productService } from '../services/productService';
import { InspectionPlan, QualityParameter, InventoryItem } from '../types';
import { FileSearch, Plus, Trash2, Save, Loader2, X } from 'lucide-react';

const InspectionPlansView: React.FC = () => {
  const [plans, setPlans] = useState<InspectionPlan[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [params, setParams] = useState<QualityParameter[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newPlan, setNewPlan] = useState<{
      itemId: string;
      name: string;
      sampleSize: number;
      parameters: {parameterId: string, minValue: number, maxValue: number, expectedValue: string}[]
  }>({
      itemId: '',
      name: '',
      sampleSize: 10,
      parameters: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [planData, itemData, paramData] = await Promise.all([
        qualityService.getInspectionPlans(),
        productService.getAllItems(),
        qualityService.getParameters()
    ]);
    setPlans(planData);
    setItems(itemData);
    setParams(paramData);
    setLoading(false);
  };

  const handleAddParam = () => {
      setNewPlan({
          ...newPlan,
          parameters: [...newPlan.parameters, { parameterId: '', minValue: 0, maxValue: 0, expectedValue: '' }]
      });
  };

  const updateParam = (index: number, field: string, value: any) => {
      const updated = [...newPlan.parameters];
      // @ts-ignore
      updated[index][field] = value;
      setNewPlan({ ...newPlan, parameters: updated });
  };

  const removeParam = (index: number) => {
      const updated = newPlan.parameters.filter((_, i) => i !== index);
      setNewPlan({ ...newPlan, parameters: updated });
  };

  const handleSave = async () => {
      if(!newPlan.itemId || !newPlan.name || newPlan.parameters.length === 0) return alert("Please fill all fields");
      const item = items.find(i => i.id === newPlan.itemId);
      
      const parameters = newPlan.parameters.map(p => {
          const paramDef = params.find(pd => pd.id === p.parameterId);
          return {
              parameterId: p.parameterId,
              parameterName: paramDef?.name || 'Unknown',
              minValue: p.minValue,
              maxValue: p.maxValue,
              expectedValue: p.expectedValue
          };
      });

      await qualityService.saveInspectionPlan({
          itemId: newPlan.itemId,
          itemName: item?.name || 'Unknown',
          name: newPlan.name,
          sampleSize: newPlan.sampleSize,
          parameters
      });
      
      setIsAdding(false);
      setNewPlan({ itemId: '', name: '', sampleSize: 10, parameters: [] });
      loadData();
  };

  const handleDelete = async (id: string) => {
      if(confirm('Delete this plan?')) {
          await qualityService.deleteInspectionPlan(id);
          loadData();
      }
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FileSearch className="text-blue-600" size={20}/> Inspection Plans
                </h2>
                <button onClick={() => setIsAdding(!isAdding)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex gap-2 items-center">
                    <Plus size={16}/> Create Plan
                </button>
            </div>

            {isAdding && (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6 animate-fade-in">
                    <h3 className="font-bold text-slate-700 mb-4">New Inspection Plan</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Item</label>
                            <select className="w-full border rounded p-2" value={newPlan.itemId} onChange={e => setNewPlan({...newPlan, itemId: e.target.value})}>
                                <option value="">Select Item</option>
                                {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Plan Name</label>
                            <input type="text" className="w-full border rounded p-2" placeholder="e.g. Standard Inward" value={newPlan.name} onChange={e => setNewPlan({...newPlan, name: e.target.value})}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Sample Size (%)</label>
                            <input type="number" className="w-full border rounded p-2" value={newPlan.sampleSize} onChange={e => setNewPlan({...newPlan, sampleSize: Number(e.target.value)})}/>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-600 mb-2">Test Parameters</label>
                        {newPlan.parameters.map((p, idx) => {
                            const paramDef = params.find(pd => pd.id === p.parameterId);
                            return (
                                <div key={idx} className="flex gap-2 mb-2 items-center">
                                    <select className="w-1/3 border rounded p-2 text-sm" value={p.parameterId} onChange={e => updateParam(idx, 'parameterId', e.target.value)}>
                                        <option value="">Select Parameter</option>
                                        {params.map(pd => <option key={pd.id} value={pd.id}>{pd.name} ({pd.type})</option>)}
                                    </select>
                                    
                                    {paramDef?.type === 'Numeric' ? (
                                        <>
                                            <input type="number" placeholder="Min" className="w-20 border rounded p-2 text-sm" value={p.minValue} onChange={e => updateParam(idx, 'minValue', Number(e.target.value))}/>
                                            <input type="number" placeholder="Max" className="w-20 border rounded p-2 text-sm" value={p.maxValue} onChange={e => updateParam(idx, 'maxValue', Number(e.target.value))}/>
                                        </>
                                    ) : (
                                        <input type="text" placeholder="Expected Value (e.g. Pass)" className="w-40 border rounded p-2 text-sm" value={p.expectedValue} onChange={e => updateParam(idx, 'expectedValue', e.target.value)}/>
                                    )}
                                    
                                    <button onClick={() => removeParam(idx)} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                                </div>
                            );
                        })}
                        <button onClick={handleAddParam} className="text-xs text-blue-600 font-medium mt-1 hover:underline">+ Add Parameter</button>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded text-sm">Cancel</button>
                        <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">Save Plan</button>
                    </div>
                </div>
            )}

            <div className="grid gap-4">
                {loading ? <div className="text-center py-8"><Loader2 className="animate-spin inline"/></div> :
                 plans.length === 0 ? <div className="text-center text-slate-500 py-8">No plans defined.</div> :
                 plans.map(p => (
                    <div key={p.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-slate-800">{p.name}</h3>
                                <p className="text-sm text-slate-600">{p.itemName}</p>
                            </div>
                            <button onClick={() => handleDelete(p.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={18}/></button>
                        </div>
                        <div className="text-xs text-slate-500 bg-white p-3 rounded border border-slate-200">
                            <p className="font-semibold mb-1">Parameters ({p.parameters.length}):</p>
                            <ul className="list-disc pl-4 space-y-1">
                                {p.parameters.map((param, idx) => (
                                    <li key={idx}>
                                        <span className="font-medium">{param.parameterName}:</span> 
                                        {param.expectedValue ? ` Expect "${param.expectedValue}"` : ` Range ${param.minValue} - ${param.maxValue}`}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default InspectionPlansView;
