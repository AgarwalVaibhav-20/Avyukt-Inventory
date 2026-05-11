import React, { useState } from 'react';
import { exportService } from '@/services/exportService';
import ExportDialog, { ExportPeriod, ExportFormat } from '@/components/common/ExportDialog';
import { Download } from 'lucide-react';
import DashboardMovement from '@/components/dashboard/DashboardMovement'; // Reusing component

const MovementAnalysisReportView: React.FC = () => {
  const [showExportDialog, setShowExportDialog] = useState(false);

  const handleExport = async (period: ExportPeriod, format: ExportFormat) => {
    await exportService.exportMovementAnalysis(period, format);
  };
  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Movement Analysis Report</h1>
          <p className="text-slate-600">Track inbound and outbound stock movements with detailed insights</p>
        </div>
        <button
          onClick={() => setShowExportDialog(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
        >
          <Download size={20} />
          Export
        </button>
      </div>
      <DashboardMovement />

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
        reportName="Movement Analysis Report"
      />
    </div>
  );
};

export default MovementAnalysisReportView;
