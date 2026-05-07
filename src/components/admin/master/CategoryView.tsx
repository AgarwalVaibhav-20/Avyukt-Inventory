import React from 'react';
import MasterCrud from '../MasterCrud';

const CategoryView: React.FC = () => {
  return (
    <MasterCrud 
      title="Item Categories" 
      description="Manage product classifications and groups."
      type="category"
      columns={[
        { key: 'name', label: 'Category Name' },
        { key: 'description', label: 'Description' }
      ]}
    />
  );
};

export default CategoryView;
