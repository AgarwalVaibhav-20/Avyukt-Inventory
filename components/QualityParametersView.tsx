import React from 'react';
import MasterCrud from './MasterCrud';
import { qualityService } from '../services/qualityService';

const QualityParametersView: React.FC = () => {
  return (
    <MasterCrud 
      title="Quality Parameters" 
      description="Define standard test parameters (e.g., pH, Dimensions, Weight) used in inspection plans."
      columns={[
        { key: 'name', label: 'Parameter Name' },
        { key: 'uom', label: 'Unit (UoM)' },
        { key: 'type', label: 'Data Type' }, // Numeric, Pass/Fail
        { key: 'description', label: 'Description' }
      ]}
      fetchData={qualityService.getParameters}
      addData={qualityService.addParameter}
      deleteData={qualityService.deleteParameter}
    />
  );
};

export default QualityParametersView;
