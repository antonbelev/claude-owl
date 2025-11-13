import React from 'react';
import './PageHeader.css';

interface PageHeaderAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'docs';
  disabled?: boolean;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: PageHeaderAction[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => {
  return (
    <div className="page-header">
      <div className="page-header-content">
        <h1 className="page-header-title">{title}</h1>
        {description && <p className="page-header-description">{description}</p>}
      </div>
      {actions && actions.length > 0 && (
        <div className="page-header-actions">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`page-header-btn page-header-btn-${action.variant || 'primary'}`}
              disabled={action.disabled}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
