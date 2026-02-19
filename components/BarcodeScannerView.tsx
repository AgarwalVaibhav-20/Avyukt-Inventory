import React, { useState, useEffect, useRef } from 'react';
import { automationService } from '../services/automationService';
import { ScanLog, InventoryItem } from '../types';
import { Scan, Smartphone, CheckCircle2, XCircle, Search, Clock, Box } from 'lucide-react';

interface BarcodeScannerViewProps {
  isMobileMode?: boolean;
}

const BarcodeScannerView: React.FC<BarcodeScannerViewProps> = ({ isMobileMode = false }) => {
  const [scanInput, setScanInput] = useState('');
  const [history, setHistory] = useState<ScanLog[]>([]);
  const [lastScannedItem, setLastScannedItem] = useState<InventoryItem | null>(null);
  const [lastScanStatus, setLastScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadHistory();
    // Auto focus for immediate scanning simulation
    if(inputRef.current) inputRef.current.focus();
  }, []);

  const loadHistory = async () => {
      const logs = await automationService.getScanHistory();
      setHistory(logs);
  };

  const handleScan = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!scanInput.trim()) return;

      const code = scanInput.trim();
      setScanInput(''); // Clear immediately for next scan
      
      const item = await automationService.scanItem(code);
      
      if(item) {
          setLastScannedItem(item);
          setLastScanStatus('success');
          await automationService.logScan({
              scannedCode: code,
              itemId: item.id,
              itemName: item.name,
              actionType: 'Check',
              status: 'Success',
              deviceId: isMobileMode ? 'Mobile-App' : 'Desktop-Station'
          });
      } else {
          setLastScannedItem(null);
          setLastScanStatus('error');
          await automationService.logScan({
              scannedCode: code,
              actionType: 'Check',
              status: 'Not Found',
              deviceId: isMobileMode ? 'Mobile-App' : 'Desktop-Station'
          });
      }
      loadHistory();
  };

  const MobileLayout = () => (
      <div className="max-w-md mx-auto bg-slate-900 min-h-[600px] rounded-3xl border-8 border-slate-800 shadow-2xl overflow-hidden flex flex-col relative text-white">
          <div className="absolute top-0 w-full h-6 bg-black opacity-50 z-10"></div>
          
          {/* Mobile Header */}
          <div className="p-4 pt-8 bg-slate-800 flex justify-between items-center">
              <span className="font-bold text-lg flex items-center gap-2"><Scan size={20} className="text-blue-400"/> ACT Scan</span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>

          {/* Scanner Area (Simulation) */}
          <div className="flex-1 bg-black/40 relative flex flex-col items-center justify-center p-6">
              <div className="w-64 h-64 border-2 border-blue-500/50 rounded-lg relative flex items-center justify-center mb-6">
                  <div className="absolute inset-0 border-t-2 border-l-2 border-blue-400 w-8 h-8 -mt-1 -ml-1"></div>
                  <div className="absolute inset-0 border-t-2 border-r-2 border-blue-400 w-8 h-8 -mt-1 -mr-1 right-0"></div>
                  <div className="absolute inset-0 border-b-2 border-l-2 border-blue-400 w-8 h-8 -mb-1 -ml-1 bottom-0"></div>
                  <div className="absolute inset-0 border-b-2 border-r-2 border-blue-400 w-8 h-8 -mb-1 -mr-1 bottom-0 right-0"></div>
                  
                  {/* Result Overlay */}
                  {lastScanStatus === 'success' && <CheckCircle2 size={64} className="text-green-500 animate-bounce"/>}
                  {lastScanStatus === 'error' && <XCircle size={64} className="text-red-500 animate-pulse"/>}
              </div>

              {lastScannedItem ? (
                  <div className="bg-slate-800 p-4 rounded-xl w-full text-center animate-fade-in border border-slate-700">
                      <p className="text-blue-400 text-xs uppercase font-bold tracking-wider">Identified</p>
                      <h3 className="font-bold text-lg text-white mb-1">{lastScannedItem.name}</h3>
                      <p className="text-slate-400 text-sm mb-3">SKU: {lastScannedItem.sku}</p>
                      <div className="flex justify-center gap-4 text-sm">
                          <div className="bg-slate-700 px-3 py-1 rounded">Qty: {lastScannedItem.stock}</div>
                          <div className="bg-slate-700 px-3 py-1 rounded">${lastScannedItem.salePrice}</div>
                      </div>
                  </div>
              ) : (
                  <p className="text-slate-400 text-sm">Point camera at barcode or enter manually</p>
              )}
          </div>

          {/* Manual Input */}
          <div className="p-4 bg-slate-800 border-t border-slate-700">
              <form onSubmit={handleScan} className="relative">
                  <Scan className="absolute left-3 top-3 text-slate-500" size={18}/>
                  <input 
                    ref={inputRef}
                    type="text" 
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="Enter Barcode..."
                    value={scanInput}
                    onChange={e => setScanInput(e.target.value)}
                  />
              </form>
          </div>
      </div>
  );

  if (isMobileMode) return <MobileLayout />;

  return (
    <div className="space-y-6">
        {/* Desktop Scanner Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {/* Input Area */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex flex-col items-center justify-center text-center">
                    <div className={`p-4 rounded-full mb-4 ${lastScanStatus === 'success' ? 'bg-green-100 text-green-600' : lastScanStatus === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        <Scan size={48} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Ready to Scan</h2>
                    <p className="text-slate-500 mb-6">Use your handheld scanner or type the barcode below.</p>
                    
                    <form onSubmit={handleScan} className="w-full max-w-md relative">
                        <input 
                            ref={inputRef}
                            type="text" 
                            className="w-full text-center text-lg py-3 px-4 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300"
                            placeholder="Scan Barcode Here..."
                            value={scanInput}
                            onChange={e => setScanInput(e.target.value)}
                            autoFocus
                        />
                    </form>
                </div>

                {/* Last Scanned Result */}
                {lastScannedItem && (
                    <div className="bg-white rounded-xl border border-green-200 shadow-sm p-6 flex items-start gap-4 animate-fade-in">
                        <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Box size={40} className="text-slate-400"/>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{lastScannedItem.name}</h3>
                                    <p className="text-slate-500 mb-2">{lastScannedItem.sku} • {lastScannedItem.category}</p>
                                </div>
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">MATCH FOUND</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-2">
                                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                    <p className="text-xs text-slate-500">Current Stock</p>
                                    <p className="font-bold text-lg text-slate-800">{lastScannedItem.stock}</p>
                                </div>
                                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                    <p className="text-xs text-slate-500">Location</p>
                                    <p className="font-bold text-lg text-slate-800">A-12-04</p>
                                </div>
                                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                    <p className="text-xs text-slate-500">Price</p>
                                    <p className="font-bold text-lg text-slate-800">${lastScannedItem.salePrice}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {lastScanStatus === 'error' && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-center text-red-700 font-medium animate-fade-in">
                        Item not found in database.
                    </div>
                )}
            </div>

            {/* History Sidebar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-fit max-h-[600px] overflow-hidden flex flex-col">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Clock size={18}/> Session History
                </h3>
                <div className="overflow-y-auto flex-1 space-y-2 pr-1">
                    {history.length === 0 ? <p className="text-slate-400 text-sm text-center py-4">No scans yet.</p> :
                     history.map(log => (
                        <div key={log.id} className="text-sm p-2 rounded border border-slate-100 bg-slate-50 flex justify-between items-center">
                            <div>
                                <p className="font-medium text-slate-700">{log.scannedCode}</p>
                                <p className="text-xs text-slate-500">{log.itemName || 'Unknown Item'}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded ${log.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {log.timestamp}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default BarcodeScannerView;