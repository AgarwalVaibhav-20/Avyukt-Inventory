import React from 'react';
import DashboardMovement from '@/components/dashboard/DashboardMovement'; // Reusing component

const MovementAnalysisReportView: React.FC = () => {
  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Movement Analysis Report</h1>
        <p className="text-slate-600">Track inbound and outbound stock movements with detailed insights</p>
      </div>
      <DashboardMovement />
    </div>
  );
};

export default MovementAnalysisReportView;
