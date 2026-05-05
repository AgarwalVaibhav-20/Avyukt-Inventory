import React, { useState } from 'react';
import { X, Sparkles, BrainCircuit, BarChart, ArrowRight } from 'lucide-react';
import { getAiReorderSuggestions } from '@/services/geminiService';
import { MOCK_INVENTORY } from '@/constants';

interface AiAssistantModalProps {
  onClose: () => void;
}

const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'forecast' | 'reorder'>('reorder');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
        const res = await getAiReorderSuggestions(MOCK_INVENTORY);
        const parsed = JSON.parse(res);
        setSuggestions(parsed);
    } catch (e) {
        console.error("Failed to parse AI response", e);
    } finally {
        setLoading(false);
    }
  };

  // Auto fetch on mount for demo purposes if tab is reorder
  React.useEffect(() => {
    if (activeTab === 'reorder') fetchSuggestions();
  }, [activeTab]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
                <BrainCircuit size={24} className="text-blue-200"/>
            </div>
            <div>
                <h2 className="text-xl font-bold">ACT AI Intelligence</h2>
                <p className="text-blue-200 text-xs">Advanced Demand Planning & Forecasting</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
            <button 
                onClick={() => setActiveTab('reorder')}
                className={`flex-1 py-4 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'reorder' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                AI Reorder Suggestions
            </button>
            <button 
                onClick={() => setActiveTab('forecast')}
                className={`flex-1 py-4 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'forecast' ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                Demand Forecasting
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            {activeTab === 'reorder' && (
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-800 flex items-start gap-2">
                            <Sparkles size={16} className="mt-0.5"/>
                            Based on your current stock levels, consumption rate history, and lead times, Gemini AI recommends the following actions immediately to prevent stockouts.
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-slate-500 text-sm">Analyzing supply chain patterns...</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {suggestions.length > 0 ? suggestions.map((s: any, idx: number) => (
                                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-900">{s.sku}</span>
                                            <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">Critical</span>
                                        </div>
                                        <p className="text-sm text-slate-600">{s.reason}</p>
                                    </div>
                                    <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 uppercase font-semibold">Suggested Qty</p>
                                            <p className="text-xl font-bold text-blue-600">{s.suggestedQuantity}</p>
                                        </div>
                                        <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors">
                                            <ArrowRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-slate-500">
                                    No immediate reorder suggestions found. Inventory levels are healthy.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'forecast' && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BarChart size={64} className="text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Demand Forecasting Module</h3>
                    <p className="text-slate-500 max-w-md">
                        This advanced module analyzes historical sales data to predict future demand trends. 
                        Enable "Advanced Analytics" in settings to connect historical datasets.
                    </p>
                    <button className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                        Connect Historical Data
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AiAssistantModal;
