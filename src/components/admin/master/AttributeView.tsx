import React from 'react';
import MasterCrud from '../MasterCrud';

const AttributeView: React.FC = () => {
  return (
    <MasterCrud 
      title="Item Attributes" 
      description="Global attributes for item variants (Color, Size, Material)."
      type="attribute"
      columns={[
        { key: 'name', label: 'Attribute Name' },
        { key: 'options', label: 'Options', type: 'array' }
      ]}
    />
  );
};

export default AttributeView;
export { };
