import React from 'react';
import MasterCrud from '../MasterCrud';

const UomView: React.FC = () => {
  return (
    <MasterCrud 
      title="Unit of Measure (UoM)" 
      description="Manage standard units for stock keeping."
      type="uom"
      columns={[
        { key: 'name', label: 'Unit Name' },
        { key: 'code', label: 'Unit Code' }
      ]}
    />
  );
};

export default UomView;
