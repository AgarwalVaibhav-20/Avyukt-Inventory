import React, { useState } from 'react';
import { exportService } from '@/services/exportService';
import ExportDialog, { ExportPeriod, ExportFormat } from '@/components/common/ExportDialog';
import { Download } from 'lucide-react';
import ValuationAnalysisView from '@/components/valuation/ValuationAnalysisView'; // Reusing component

const ValuationReportDocView: React.FC = () => {
  const [showExportDialog, setShowExportDialog] = useState(false);

  const handleExport = async (period: ExportPeriod, format: ExportFormat) => {
    await exportService.exportValuation(period, format);
  };

  return (
    <div className="space-y-6">
        {/* Header */}\n        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Detailed Inventory Valuation</h1>
            <p className="text-slate-600">Analyze inventory valuation methods and stock worth</p>
          </div>
          <button
            onClick={() => setShowExportDialog(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
          >
            <Download size={20} />
            Export
          </button>
        </div>
        <ValuationAnalysisView />

        {/* Export Dialog */}
        <ExportDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          onExport={handleExport}
          reportName="Inventory Valuation Report"
        />
    </div>
  );
};

export default ValuationReportDocView;
