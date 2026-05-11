import React, { useState } from 'react';
import { exportService } from '@/services/exportService';
import ExportDialog, { ExportPeriod, ExportFormat } from '@/components/common/ExportDialog';
import { Download } from 'lucide-react';
import DashboardWarehouse from '@/components/dashboard/DashboardWarehouse'; // Reusing existing component for consistency

const WarehouseReportView: React.FC = () => {
  const [showExportDialog, setShowExportDialog] = useState(false);

  const handleExport = async (period: ExportPeriod, format: ExportFormat) => {
    await exportService.exportWarehouse(period, format);
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Warehouse-wise Stock Report</h1>
          <p className="text-slate-600">Monitor inventory distribution across all warehouses</p>
        </div>
        <button
          onClick={() => setShowExportDialog(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
        >
          <Download size={20} />
          Export
        </button>
      </div>
      <DashboardWarehouse />

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
        reportName="Warehouse Report"
      />
    </div>
  );
};

export default WarehouseReportView;
