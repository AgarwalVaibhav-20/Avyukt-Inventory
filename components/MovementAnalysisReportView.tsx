import React from 'react';
import DashboardMovement from './DashboardMovement'; // Reusing component

const MovementAnalysisReportView: React.FC = () => {
  return (
    <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800">Movement Analysis Report</h2>
        <DashboardMovement />
    </div>
  );
};

export default MovementAnalysisReportView;
