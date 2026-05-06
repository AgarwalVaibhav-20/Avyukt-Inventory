import React from 'react';
import ValuationAnalysisView from '@/components/valuation/ValuationAnalysisView'; // Reusing component

const ValuationReportDocView: React.FC = () => {
  return (
    <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800">Detailed Inventory Valuation</h2>
        <ValuationAnalysisView />
    </div>
  );
};

export default ValuationReportDocView;
