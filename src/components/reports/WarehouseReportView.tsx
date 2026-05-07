import React from 'react';
import DashboardWarehouse from '@/components/dashboard/DashboardWarehouse'; // Reusing existing component for consistency

const WarehouseReportView: React.FC = () => {
  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Warehouse-wise Stock Report</h1>
        <p className="text-slate-600">Monitor inventory distribution across all warehouses</p>
      </div>
      <DashboardWarehouse />
    </div>
  );
};

export default WarehouseReportView;
