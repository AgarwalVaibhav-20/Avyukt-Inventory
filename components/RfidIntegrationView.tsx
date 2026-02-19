import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { InventoryItem } from '../types';
import { Radio, Wifi, Database, Loader2, Play, Square } from 'lucide-react';

const RfidIntegrationView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [detectedTags, setDetectedTags] = useState<{id: string, epc: string, sku: string, rssi: number}[]>([]);

  useEffect(() => {
    productService.getAllItems().then(setItems);
  }, []);

  // Simulation effect
  useEffect(() => {
      let interval: number;
      if (scanning && items.length > 0) {
          interval = window.setInterval(() => {
              // Simulate finding a tag
              const randomItem = items[Math.floor(Math.random() * items.length)];
              const epc = `E200-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
              const rssi = -Math.floor(Math.random() * 40 + 40); // -40 to -80 dBm
              
              setDetectedTags(prev => {
                  // Keep last 10, check uniqueness by simulated EPC or Item
                  if(prev.some(t => t.sku === randomItem.sku)) return prev; // Avoid duplicates for simpler demo
                  return [{ id: Date.now().toString(), epc, sku: randomItem.sku, rssi }, ...prev].slice(0, 20);
              });
          }, 1500);
      }
      return () => clearInterval(interval);
  }, [scanning, items]);

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Radio className="text-indigo-600" size={24}/> RFID Reader Interface
                </h2>
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${scanning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                    <span className="text-sm font-medium text-slate-600">{scanning ? 'Reader Active' : 'Reader Disconnected'}</span>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center p-8 bg-slate-900 rounded-2xl text-white relative overflow-hidden mb-6">
                {scanning && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-96 h-96 border border-white/10 rounded-full animate-ping absolute"></div>
                        <div className="w-64 h-64 border border-white/20 rounded-full animate-ping delay-100 absolute"></div>
                    </div>
                )}
                
                <Wifi size={64} className={`mb-4 ${scanning ? 'text-green-400' : 'text-slate-600'}`}/>
                <h3 className="text-2xl font-bold mb-2">{detectedTags.length} Tags Detected</h3>
                <p className="text-slate-400 mb-6">Zebra RFD8500 Simulator</p>
                
                <button 
                    onClick={() => setScanning(!scanning)}
                    className={`px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${
                        scanning 
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30' 
                        : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30'
                    }`}
                >
                    {scanning ? <><Square size={18}/> Stop Scanning</> : <><Play size={18}/> Start Reading</>}
                </button>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center gap-2">
                    <Database size={16} className="text-slate-500"/>
                    <span className="font-semibold text-slate-700">Live Tag Stream</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b">
                            <tr>
                                <th className="px-6 py-3">EPC / Tag ID</th>
                                <th className="px-6 py-3">Matched Item SKU</th>
                                <th className="px-6 py-3">Signal (RSSI)</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {detectedTags.length === 0 ? (
                                <tr><td colSpan={4} className="py-8 text-center text-slate-500">Waiting for tags...</td></tr>
                            ) : (
                                detectedTags.map(tag => (
                                    <tr key={tag.id} className="animate-fade-in">
                                        <td className="px-6 py-3 font-mono text-indigo-600">{tag.epc}</td>
                                        <td className="px-6 py-3 font-bold text-slate-800">{tag.sku}</td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-green-500" style={{width: `${100 + tag.rssi}%`}}></div>
                                                </div>
                                                <span className="text-xs text-slate-500">{tag.rssi} dBm</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                                Identified
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
  );
};

export default RfidIntegrationView;
