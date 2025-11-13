/**
 * HookValidationPanel - Display validation results for a hook
 *
 * Shows security score and issues with severity indicators
 */

import type { HookValidationResult, SecurityScore } from '@/shared/types/hook.types';
import './HooksManager.css';

interface HookValidationPanelProps {
  validation: HookValidationResult;
  className?: string;
}

const SCORE_CONFIG: Record<
  SecurityScore,
  {
    label: string;
    icon: string;
    badgeClass: string;
    description: string;
  }
> = {
  green: {
    label: 'Safe',
    icon: '✓',
    badgeClass: 'badge-green',
    description: 'No security issues detected',
  },
  yellow: {
    label: 'Caution',
    icon: '⚠',
    badgeClass: 'badge-yellow',
    description: 'Review recommended - potential risks detected',
  },
  red: {
    label: 'Danger',
    icon: '✕',
    badgeClass: 'badge-red',
    description: 'Critical security issues - do not use',
  },
};

export function HookValidationPanel({ validation, className }: HookValidationPanelProps) {
  const scoreConfig = SCORE_CONFIG[validation.score];

  return (
    <div className={`validation-panel ${className || ''}`}>
      <div className="card-header validation-header">
        <span className="card-description">Security Validation</span>
        <span className={`badge ${scoreConfig.badgeClass}`}>
          {scoreConfig.icon} {scoreConfig.label}
        </span>
      </div>
      <div className="card-content">
        <p className="card-description">{scoreConfig.description}</p>

        {validation.issues.length > 0 && (
          <div className="validation-issues">
            <h4 className="card-description">Issues ({validation.issues.length})</h4>
            <div>
              {validation.issues.map((issue, index) => {
                const severityClass =
                  issue.severity === 'error'
                    ? 'validation-issue-error'
                    : issue.severity === 'warning'
                      ? 'validation-issue-warning'
                      : 'validation-issue-info';

                const severityIcon =
                  issue.severity === 'error' ? '✕' : issue.severity === 'warning' ? '⚠' : 'ℹ';

                return (
                  <div key={index} className={`validation-issue ${severityClass}`}>
                    <span className="validation-issue-icon">{severityIcon}</span>
                    <div className="validation-issue-content">
                      <p className="validation-issue-message">{issue.message}</p>
                      {issue.suggestion && (
                        <p className="validation-issue-suggestion">💡 {issue.suggestion}</p>
                      )}
                      {issue.code && <p className="validation-issue-code">Code: {issue.code}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {validation.issues.length === 0 && (
          <div className="validation-success">
            <span>✓</span>
            <p>All security checks passed</p>
          </div>
        )}
      </div>
    </div>
  );
}
