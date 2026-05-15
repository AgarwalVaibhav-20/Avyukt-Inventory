import React from 'react';
import MasterCrud from '../MasterCrud';

const BrandView: React.FC = () => {
  return (
    <MasterCrud 
      title="Brand Master" 
      description="Manage manufacturers and brands."
      type="brand"
      columns={[
        { key: 'name', label: 'Brand Name' },
        { key: 'manufacturer', label: 'Manufacturer' }
      ]}
      filterFields={[
        {
          id: "manufacturer",
          label: "Manufacturer",
          type: "multi-select",
          options: [] // To be populated from unique manufacturers in data
        }
      ]}
    />
  );
};

export default BrandView;
