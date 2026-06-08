import React, { useState, useEffect } from 'react';
import { productService } from '@/services/productService';
import { automationService } from '@/services/automationService';
import { InventoryItem } from '@/types';
import { QrCode, Search, Printer, Download, Loader2 } from 'lucide-react';

const BarcodeGeneratorView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [format, setFormat] = useState<'code128' | 'ean13' | 'qr'>('code128');
  const [isGenerated, setIsGenerated] = useState(false);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
        setPage(1);
        loadData(1, searchTerm, true);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadData = async (pageNum: number, search: string, reset = false) => {
    setLoading(true);
    try {
        const { products, total } = await productService.getPaginatedItems(pageNum, 15, search);
        setItems(prev => reset ? products : [...prev, ...products]);
        setTotalItems(total);
    } catch (err) {
        console.error("Failed to load products:", err);
    } finally {
        setLoading(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadData(nextPage, searchTerm, false);
  };

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
            <div className="w-full md:w-1/3 border-r border-slate-100 pr-0 md:pr-6 flex flex-col">
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
                <div className="overflow-y-auto flex-1 max-h-[400px] space-y-2">
                     {items.map(item => (
                        <button 
                            key={item.id}
                            onClick={() => { setSelectedItem(item); setIsGenerated(false); }}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedItem?.id === item.id ? 'bg-blue-50 border-blue-500' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                        >
                            <p className="font-medium text-sm text-slate-800 truncate">{item.name}</p>
                            <div className="flex justify-between mt-1">
                                <span className="text-xs text-slate-500">{item.sku}</span>
                                <span className="text-xs text-slate-400 font-mono">{item.barcode || 'No BC'}</span>
                            </div>
                        </button>
                    ))}
                    
                    {loading && <div className="text-center py-4"><Loader2 className="animate-spin-slow inline"/></div>}
                    
                    {!loading && items.length < totalItems && (
                        <button 
                            onClick={handleLoadMore}
                            className="w-full py-2 text-sm text-blue-600 bg-blue-50 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                        >
                            Load More
                        </button>
                    )}
                    
                    {!loading && items.length === 0 && (
                        <div className="text-center py-8 text-slate-500 text-sm">
                            No items found.
                        </div>
                    )}
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
                                {!isGenerated ? (
                                    <button 
                                        onClick={() => setIsGenerated(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-colors"
                                    >
                                        Generate {format === 'qr' ? 'QR Code' : 'Barcode'}
                                    </button>
                                ) : (
                                    <img src={getPreviewUrl()} alt="Barcode" className="max-h-full max-w-full object-contain"/>
                                )}
                            </div>
                            {isGenerated && <p className="text-xs font-mono text-slate-400 tracking-wider">{selectedItem.barcode || selectedItem.sku}</p>}
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-6">
                            <button onClick={() => {setFormat('code128'); setIsGenerated(false);}} className={`py-2 text-xs font-medium rounded ${format === 'code128' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600'}`}>Code 128</button>
                            <button onClick={() => {setFormat('ean13'); setIsGenerated(false);}} className={`py-2 text-xs font-medium rounded ${format === 'ean13' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600'}`}>EAN-13</button>
                            <button onClick={() => {setFormat('qr'); setIsGenerated(false);}} className={`py-2 text-xs font-medium rounded ${format === 'qr' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600'}`}>QR Code</button>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => {
                                    const url = getPreviewUrl();
                                    if (!url) return;
                                    const win = window.open('', '_blank');
                                    if (win) {
                                        win.document.write(`<html><body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;"><img src="${url}" style="max-width:100%;max-height:100%;" onload="window.print();window.close()"/></body></html>`);
                                        win.document.close();
                                    }
                                }}
                                className="flex-1 bg-slate-800 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-900"
                            >
                                <Printer size={16}/> Print
                            </button>
                            <button 
                                onClick={async () => {
                                    const url = getPreviewUrl();
                                    if (!url || !selectedItem) return;
                                    try {
                                        const response = await fetch(url);
                                        const blob = await response.blob();
                                        const downloadUrl = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = downloadUrl;
                                        a.download = `${selectedItem.sku || 'barcode'}_${format}.png`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        window.URL.revokeObjectURL(downloadUrl);
                                    } catch (err) {
                                        console.error('Failed to download barcode:', err);
                                        alert('Failed to download barcode image');
                                    }
                                }}
                                className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50"
                            >
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
