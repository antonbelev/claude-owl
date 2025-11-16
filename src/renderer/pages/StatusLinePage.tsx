import React from 'react';
import { StatusLineManager } from '../components/StatusLine/StatusLineManager';

export const StatusLinePage: React.FC = () => {
  return (
    <div className="page statusline-page">
      <StatusLineManager />
    </div>
  );
};
