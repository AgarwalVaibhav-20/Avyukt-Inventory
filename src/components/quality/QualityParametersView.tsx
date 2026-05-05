import React from 'react';
import MasterCrud from '@/components/admin/MasterCrud';
import { qualityService } from '@/services/qualityService';

const QualityParametersView: React.FC = () => {
  return (
    <MasterCrud 
      title="Quality Parameters" 
      description="Define standard test parameters (e.g., pH, Dimensions, Weight) used in inspection plans."
      columns={[
        { key: 'name', label: 'Parameter Name', type: 'text' },
        { key: 'uom', label: 'Unit (UoM)', type: 'text' },
        { key: 'type', label: 'Data Type', type: 'select', options: ['Numeric', 'Pass/Fail', 'Text', 'Percentage', 'Boolean'] },
        { key: 'description', label: 'Description', type: 'text' }
      ]}
      fetchData={qualityService.getParameters}
      addData={qualityService.addParameter}
      deleteData={qualityService.deleteParameter}
    />
  );
};

export default QualityParametersView;
