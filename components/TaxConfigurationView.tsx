import React, { useState, useEffect } from 'react';
import MasterCrud from './MasterCrud';
import { settingsService } from '../services/settingsService';

const TaxConfigurationView: React.FC = () => {
  return (
    <MasterCrud 
      title="Tax & GST Configuration"
      description="Define tax rates and rules for sales and purchase transactions."
      columns={[
        { key: 'taxName', label: 'Tax Name' },
        { key: 'rate', label: 'Rate (%)' },
        { key: 'country', label: 'Jurisdiction' },
        { key: 'type', label: 'Type' }
      ]}
      fetchData={settingsService.getTaxConfigs}
      addData={settingsService.saveTaxConfig}
      deleteData={settingsService.deleteTaxConfig}
    />
  );
};

export default TaxConfigurationView;
