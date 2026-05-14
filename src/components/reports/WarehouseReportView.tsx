import React, { useState } from "react";
import { exportService } from "@/services/exportService";
import ExportDialog, {
  ExportPeriod,
  ExportFormat,
} from "@/components/common/ExportDialog";
import { Download } from "lucide-react";
import DashboardWarehouse from "@/components/dashboard/DashboardWarehouse";
import { Button } from "@/components/ui/button";

const WarehouseReportView: React.FC = () => {
  const [showExportDialog, setShowExportDialog] = useState(false);

  const handleExport = async (period: ExportPeriod, format: ExportFormat) => {
    await exportService.exportWarehouse(period, format);
  };

  return (
    <div className="space-y-6 pb-8 bg-white min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Warehouse-wise Stock Report
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor inventory distribution across all warehouses
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowExportDialog(true)}
          className="gap-2"
        >
          <Download size={15} /> Export
        </Button>
      </div>
      <DashboardWarehouse />
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
