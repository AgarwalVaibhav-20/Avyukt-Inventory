import React from 'react';
import MasterCrud from '@/components/admin/MasterCrud';
import { settingsService } from '@/services/settingsService';

const CustomFieldsView: React.FC = () => {
  return (
    <MasterCrud 
      title="Custom Fields"
      description="Extend items, orders, and vendors with custom attributes."
      columns={[
        { key: 'module', label: 'Module' },
        { key: 'fieldName', label: 'Field Name' },
        { key: 'fieldType', label: 'Data Type' },
        { key: 'required', label: 'Required' }
      ]}
      fetchData={settingsService.getCustomFields}
      addData={settingsService.saveCustomField}
      deleteData={settingsService.deleteCustomField}
    />
  );
};

export default CustomFieldsView;
