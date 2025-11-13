import React from 'react';
import type { PermissionRule, PermissionLevel } from '@/shared/types';

interface PermissionRuleItemProps {
  rule: PermissionRule;
  onEdit: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}

const getLevelColor = (level: PermissionLevel): string => {
  switch (level) {
    case 'deny':
      return 'rgb(239, 68, 68)'; // red-500
    case 'ask':
      return 'rgb(251, 191, 36)'; // amber-400
    case 'allow':
      return 'rgb(34, 197, 94)'; // green-500
  }
};

const getLevelIcon = (level: PermissionLevel): string => {
  switch (level) {
    case 'deny':
      return '🚫';
    case 'ask':
      return '⚠️';
    case 'allow':
      return '✅';
  }
};

export const PermissionRuleItem: React.FC<PermissionRuleItemProps> = ({
  rule,
  onEdit,
  onDelete,
  readOnly = false,
}) => {
  const levelColor = getLevelColor(rule.level);

  return (
    <div
      className="permission-rule-item"
      style={{
        borderLeftColor: levelColor,
      }}
    >
      <div className="rule-content">
        <div className="rule-header">
          <span className="rule-level-icon">{getLevelIcon(rule.level)}</span>
          <span className="rule-tool">{rule.tool}</span>
          {rule.pattern && <span className="rule-pattern">({rule.pattern})</span>}
        </div>
        {rule.description && <div className="rule-description">{rule.description}</div>}
      </div>
      {!readOnly && (
        <div className="rule-actions">
          <button onClick={onEdit} className="btn-icon" title="Edit rule">
            ⋯
          </button>
          <button onClick={onDelete} className="btn-icon btn-danger" title="Delete rule">
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
