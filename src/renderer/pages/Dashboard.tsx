import React from 'react';
import { ClaudeStatusCard } from '../components/Dashboard/ClaudeStatusCard';
import { ServiceStatusCard } from '../components/Dashboard/ServiceStatusCard';
import { VersionUpdateCard } from '../components/Dashboard/VersionUpdateCard';

export const Dashboard: React.FC = () => {
  return (
    <div className="page dashboard-page">
      <h1 className="page-title">Dashboard</h1>
      <div className="dashboard-grid">
        <VersionUpdateCard />
        <ClaudeStatusCard />
        <ServiceStatusCard />
        {/* More dashboard widgets will be added here */}
      </div>
    </div>
  );
};
