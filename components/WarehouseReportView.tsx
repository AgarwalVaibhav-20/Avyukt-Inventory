import React from 'react';
import DashboardWarehouse from './DashboardWarehouse'; // Reusing existing component for consistency

const WarehouseReportView: React.FC = () => {
  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Warehouse-wise Stock Report</h2>
        </div>
        <DashboardWarehouse />
    </div>
  );
};

export default WarehouseReportView;
