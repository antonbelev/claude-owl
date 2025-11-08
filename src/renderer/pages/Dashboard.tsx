import React from 'react';
import { ClaudeStatusCard } from '../components/Dashboard/ClaudeStatusCard';
import { ServiceStatusCard } from '../components/Dashboard/ServiceStatusCard';

export const Dashboard: React.FC = () => {
  return (
    <div className="page dashboard-page">
      <h1 className="page-title">Dashboard</h1>
      <div className="dashboard-grid">
        <ClaudeStatusCard />
        <ServiceStatusCard />
        {/* More dashboard widgets will be added here */}
      </div>
    </div>
  );
};
