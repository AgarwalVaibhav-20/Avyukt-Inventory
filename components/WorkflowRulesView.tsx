import React from 'react';
import MasterCrud from './MasterCrud';
import { settingsService } from '../services/settingsService';

const WorkflowRulesView: React.FC = () => {
  return (
    <MasterCrud 
      title="Workflow Rules"
      description="Define automated triggers and actions for business processes."
      columns={[
        { key: 'name', label: 'Rule Name' },
        { key: 'module', label: 'Module' },
        { key: 'triggerEvent', label: 'Trigger' },
        { key: 'condition', label: 'Condition' },
        { key: 'action', label: 'Action' }
      ]}
      fetchData={settingsService.getWorkflowRules}
      addData={settingsService.saveWorkflowRule}
      deleteData={settingsService.deleteWorkflowRule}
    />
  );
};

export default WorkflowRulesView;
