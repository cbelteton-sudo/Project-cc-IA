import React from 'react';
import { FieldDashboard } from '../field/FieldDashboard';

// Reusing FieldDashboard but wrapped for project context routing if needed
export const ProjectActivity = () => {
  // FieldDashboard likely uses context or hooks to get data.
  // We might need to ensure it uses the URL projectId correctly.
  return <FieldDashboard />;
};

export default ProjectActivity;
