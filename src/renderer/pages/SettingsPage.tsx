import React from 'react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="page settings-page">
      <h1 className="page-title">Settings</h1>
      <p className="page-description">
        Configure your Claude Code settings, environment variables, and preferences.
      </p>
      {/* Settings editor will be implemented here */}
      <div className="placeholder-content">
        <p>Settings editor coming soon...</p>
      </div>
    </div>
  );
};
