import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { automationService } from '../services/automationService';
import { InventoryItem } from '../types';
import { QrCode, Search, Printer, Download, Loader2 } from 'lucide-react';

const BarcodeGeneratorView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [format, setFormat] = useState<'code128' | 'ean13' | 'qr'>('code128');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await productService.getAllItems();
    setItems(data);
    setLoading(false);
  };

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPreviewUrl = () => {
      if(!selectedItem) return '';
      const data = selectedItem.barcode || selectedItem.sku;
      if(format === 'qr') return automationService.getQrCodeImageUrl(data);
      return automationService.getBarcodeImageUrl(data, format);
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-h-[500px] flex flex-col md:flex-row gap-6">
            
            {/* List Selection */}
            <div className="w-full md:w-1/3 border-r border-slate-100 pr-0 md:pr-6">
                <div className="mb-4">
                    <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <QrCode className="text-blue-600" size={20}/> Barcode Generator
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
                        <input 
                            type="text" 
                            placeholder="Search Item..." 
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-y-auto max-h-[400px] space-y-2">
                    {loading ? <div className="text-center py-4"><Loader2 className="animate-spin inline"/></div> :
                     filteredItems.map(item => (
                        <button 
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedItem?.id === item.id ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                        >
                            <p className="font-medium text-sm text-slate-800 truncate">{item.name}</p>
                            <div className="flex justify-between mt-1">
                                <span className="text-xs text-slate-500">{item.sku}</span>
                                <span className="text-xs text-slate-400 font-mono">{item.barcode || 'No BC'}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                {selectedItem ? (
                    <div className="text-center w-full max-w-sm">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
                            <h3 className="font-bold text-lg text-slate-800 mb-1">{selectedItem.name}</h3>
                            <p className="text-slate-500 text-sm mb-4">{selectedItem.sku}</p>
                            
                            <div className="flex justify-center items-center h-40 bg-white mb-2">
                                <img src={getPreviewUrl()} alt="Barcode" className="max-h-full max-w-full object-contain"/>
                            </div>
                            <p className="text-xs font-mono text-slate-400 tracking-wider">{selectedItem.barcode || selectedItem.sku}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-6">
                            <button onClick={() => setFormat('code128')} className={`py-2 text-xs font-medium rounded ${format === 'code128' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600'}`}>Code 128</button>
                            <button onClick={() => setFormat('ean13')} className={`py-2 text-xs font-medium rounded ${format === 'ean13' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600'}`}>EAN-13</button>
                            <button onClick={() => setFormat('qr')} className={`py-2 text-xs font-medium rounded ${format === 'qr' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600'}`}>QR Code</button>
                        </div>

                        <div className="flex gap-3">
                            <button className="flex-1 bg-slate-800 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-900">
                                <Printer size={16}/> Print
                            </button>
                            <button className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50">
                                <Download size={16}/> Save
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-slate-400 text-center">
                        <QrCode size={48} className="mx-auto mb-2 opacity-50"/>
                        <p>Select an item to generate barcode</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default BarcodeGeneratorView;
