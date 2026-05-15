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
        { key: 'description', label: 'Description', optional: true },
        { key: 'parentId', label: 'Parent Category', type: 'select', optional: true }
      ]}
      filterFields={[
        {
          id: "parentId",
          label: "Parent Category",
          type: "tree-select",
          placeholder: "All Categories",
          options: [] // MasterCrud handles options for tree-select if needed, or we fetch them
        }
      ]}
    />
  );
};

export default CategoryView;
