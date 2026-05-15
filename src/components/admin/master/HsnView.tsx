import React from 'react';
import MasterCrud from '../MasterCrud';

const HsnView: React.FC = () => {
  return (
    <MasterCrud 
      title="HSN / SAC Master" 
      description="Harmonized System of Nomenclature for Taxation."
      type="hsn"
      columns={[
        { key: 'hsnCode', label: 'HSN Code' },
        { key: 'description', label: 'Description', optional: true },
        { key: 'taxPercentage', label: 'Tax Rate (%)', type: 'number' }
      ]}
      filterFields={[
        {
          id: "taxPercentage",
          label: "Tax Rate (%)",
          type: "select",
          options: [] // Automatically extract all unique tax rates from data
        }
      ]}
    />
  );
};

export default HsnView;
