import React, { useState, useEffect } from 'react';
import { vendorService } from '@/services/vendorService';
import { Vendor, VendorPerformanceReview } from '@/types';
import { TrendingUp, Star, Plus, Loader2 } from 'lucide-react';

const VendorPerformanceView: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [reviews, setReviews] = useState<VendorPerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [newReview, setNewReview] = useState({
      vendorId: '',
      period: '',
      score: 80,
      metrics: { onTimeDelivery: 80, qualityAcceptance: 80, pricingCompetitiveness: 3, responsiveScore: 3 },
      notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [vData, rData] = await Promise.all([
        vendorService.getVendors(),
        vendorService.getReviews()
    ]);
    setVendors(vData);
    setReviews(rData);
    setLoading(false);
  };

  const handleAddReview = async () => {
      if(!newReview.vendorId) return alert("Select Vendor");
      const vendor = vendors.find(v => v.id === newReview.vendorId);
      
      await vendorService.addReview({
          ...newReview,
          vendorName: vendor?.name || 'Unknown'
      });
      setIsAdding(false);
      loadData();
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="text-purple-600" size={20}/> Vendor Performance Scorecard
                </h2>
                <button onClick={() => setIsAdding(!isAdding)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium flex gap-2">
                    <Plus size={16}/> Add Review
                </button>
            </div>

            {isAdding && (
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-200 mb-6 animate-fade-in">
                    <h3 className="font-bold text-purple-900 mb-4">New Performance Evaluation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-bold text-purple-800 mb-1">Vendor</label>
                            <select className="w-full border rounded p-2 text-sm" value={newReview.vendorId} onChange={e => setNewReview({...newReview, vendorId: e.target.value})}>
                                <option value="">Select Vendor</option>
                                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-purple-800 mb-1">Period</label>
                            <input className="w-full border rounded p-2 text-sm" placeholder="e.g. Q4 2023" value={newReview.period} onChange={e => setNewReview({...newReview, period: e.target.value})}/>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Overall Score (0-100)</label>
                            <input type="number" className="w-full border rounded p-2 text-sm" value={newReview.score} onChange={e => setNewReview({...newReview, score: Number(e.target.value)})}/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">On-Time Delivery %</label>
                            <input type="number" className="w-full border rounded p-2 text-sm" value={newReview.metrics.onTimeDelivery} onChange={e => setNewReview({...newReview, metrics: {...newReview.metrics, onTimeDelivery: Number(e.target.value)}})}/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Quality Acceptance %</label>
                            <input type="number" className="w-full border rounded p-2 text-sm" value={newReview.metrics.qualityAcceptance} onChange={e => setNewReview({...newReview, metrics: {...newReview.metrics, qualityAcceptance: Number(e.target.value)}})}/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Responsiveness (1-5)</label>
                            <input type="number" max="5" className="w-full border rounded p-2 text-sm" value={newReview.metrics.responsiveScore} onChange={e => setNewReview({...newReview, metrics: {...newReview.metrics, responsiveScore: Number(e.target.value)}})}/>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-600 mb-1">Review Notes</label>
                        <textarea className="w-full border rounded p-2 text-sm" rows={2} value={newReview.notes} onChange={e => setNewReview({...newReview, notes: e.target.value})}/>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-500 text-sm">Cancel</button>
                        <button onClick={handleAddReview} className="bg-purple-600 text-white px-6 py-2 rounded text-sm hover:bg-purple-700">Submit Review</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performers */}
                <div>
                    <h3 className="font-semibold text-slate-700 mb-3">Top Rated Vendors</h3>
                    <div className="space-y-3">
                        {vendors.sort((a,b) => b.rating - a.rating).slice(0, 5).map(v => (
                            <div key={v.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                                <div>
                                    <p className="font-bold text-slate-800">{v.name}</p>
                                    <p className="text-xs text-slate-500">{v.category}</p>
                                </div>
                                <div className="flex items-center gap-1 text-amber-500 font-bold bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                                    <Star size={14} fill="currentColor"/> {v.rating.toFixed(1)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Reviews */}
                <div>
                    <h3 className="font-semibold text-slate-700 mb-3">Review History</h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {reviews.length === 0 ? <p className="text-slate-400 text-sm">No reviews yet.</p> :
                         reviews.map(r => (
                            <div key={r.id} className="p-3 border rounded-lg bg-white shadow-sm">
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-sm">{r.vendorName}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded text-white font-bold ${r.score >= 80 ? 'bg-green-500' : r.score >= 50 ? 'bg-orange-500' : 'bg-red-500'}`}>{r.score}/100</span>
                                </div>
                                <p className="text-xs text-slate-500 mb-2">{r.period} • {r.date}</p>
                                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded">
                                    <span>Delivery: <strong>{r.metrics.onTimeDelivery}%</strong></span>
                                    <span>Quality: <strong>{r.metrics.qualityAcceptance}%</strong></span>
                                </div>
                                <p className="text-xs text-slate-600 mt-2 italic">"{r.notes}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default VendorPerformanceView;
