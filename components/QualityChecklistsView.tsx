import React from 'react';
import MasterCrud from './MasterCrud';
import { qualityService } from '../services/qualityService';

const QualityChecklistsView: React.FC = () => {
  return (
    <MasterCrud 
      title="Quality Checklists" 
      description="Create reusable checklist templates for general inspections (e.g. Visual Box Inspection)."
      columns={[
        { key: 'name', label: 'Checklist Name' },
        { key: 'description', label: 'Description' },
        { key: 'steps', label: 'Check Steps', type: 'array' }
      ]}
      fetchData={qualityService.getChecklists}
      addData={qualityService.addChecklist}
      deleteData={qualityService.deleteChecklist}
    />
  );
};

export default QualityChecklistsView;
