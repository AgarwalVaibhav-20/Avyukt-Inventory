import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { automationService } from '../services/automationService';
import { InventoryItem, LabelTemplate } from '../types';
import { Printer, Search, LayoutTemplate, Loader2 } from 'lucide-react';

const LabelPrintingView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [iData, tData] = await Promise.all([
        productService.getAllItems(),
        automationService.getLabelTemplates()
    ]);
    setItems(iData);
    setTemplates(tData);
    if(tData.length > 0) setSelectedTemplate(tData[0].id);
    setLoading(false);
  };

  const toggleItem = (id: string) => {
      const newSet = new Set(selectedItems);
      if(newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedItems(newSet);
  };

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handlePrint = () => {
      if(selectedItems.size === 0) return alert("Select items to print");
      setPrinting(true);
      setTimeout(() => {
          setPrinting(false);
          alert(`Sent ${selectedItems.size} labels to printer.`);
          setSelectedItems(new Set());
      }, 2000);
  };

  const currentTemplate = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Item Selection */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Select Items</h2>
                    <span className="text-sm text-slate-500">{selectedItems.size} selected</span>
                </div>
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                    <input 
                        type="text" 
                        placeholder="Filter Items..." 
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="overflow-y-auto max-h-[400px] border border-slate-200 rounded-lg divide-y divide-slate-100">
                    {loading ? <div className="p-4 text-center"><Loader2 className="animate-spin inline"/></div> :
                     filteredItems.map(item => (
                        <div 
                            key={item.id} 
                            onClick={() => toggleItem(item.id)}
                            className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${selectedItems.has(item.id) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                        >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedItems.has(item.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                                {selectedItems.has(item.id) && <div className="w-2 h-2 bg-white rounded-full"/>}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-800">{item.name}</p>
                                <p className="text-xs text-slate-500">{item.sku}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Config & Preview */}
            <div className="w-full lg:w-96 space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <LayoutTemplate size={20} className="text-purple-600"/> Label Settings
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Template</label>
                            <select 
                                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                                value={selectedTemplate}
                                onChange={e => setSelectedTemplate(e.target.value)}
                            >
                                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        
                        {/* Mock Preview */}
                        <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 flex items-center justify-center min-h-[200px]">
                            {currentTemplate ? (
                                <div className="bg-white shadow-md p-3 text-center border border-slate-200" style={{aspectRatio: currentTemplate.id === 't2' ? '4/6' : '2/1', width: '80%'}}>
                                    <div className="h-full flex flex-col justify-between">
                                        <div className="text-xs font-bold text-slate-800 uppercase border-b pb-1">ACT BS</div>
                                        <div className="my-2">
                                            <p className="font-bold text-sm">Sample Item Name</p>
                                            <p className="text-xs text-slate-500">SKU-12345</p>
                                        </div>
                                        <div className="bg-black h-8 w-full mx-auto opacity-80 mt-auto"></div>
                                    </div>
                                </div>
                            ) : <p>Select Template</p>}
                        </div>

                        <button 
                            onClick={handlePrint}
                            disabled={printing || selectedItems.size === 0}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium shadow-lg shadow-blue-200"
                        >
                            {printing ? <Loader2 className="animate-spin" size={18}/> : <Printer size={18}/>}
                            Print {selectedItems.size} Labels
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default LabelPrintingView;