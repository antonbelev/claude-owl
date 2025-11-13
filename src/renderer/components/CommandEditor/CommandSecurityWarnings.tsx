import './CommandSecurityWarnings.css';

export interface SecurityWarning {
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
}

export interface CommandSecurityWarningsProps {
  warnings: SecurityWarning[];
}

const SEVERITY_ICONS = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🔵',
};

const SEVERITY_LABELS = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
};

export function CommandSecurityWarnings({ warnings }: CommandSecurityWarningsProps) {
  if (warnings.length === 0) return null;

  const criticalCount = warnings.filter(w => w.severity === 'critical').length;
  const highCount = warnings.filter(w => w.severity === 'high').length;
  const mediumCount = warnings.filter(w => w.severity === 'medium').length;
  const lowCount = warnings.filter(w => w.severity === 'low').length;

  return (
    <div className="security-warnings">
      <div className="warnings-header">
        <h4>⚠️ Security Warnings</h4>
        <div className="warning-summary">
          {criticalCount > 0 && <span className="critical-badge">{criticalCount} Critical</span>}
          {highCount > 0 && <span className="high-badge">{highCount} High</span>}
          {mediumCount > 0 && <span className="medium-badge">{mediumCount} Medium</span>}
          {lowCount > 0 && <span className="low-badge">{lowCount} Low</span>}
        </div>
      </div>

      <div className="warnings-list">
        {warnings.map((warning, idx) => (
          <div key={idx} className={`warning-item ${warning.severity}`}>
            <div className="warning-icon">{SEVERITY_ICONS[warning.severity]}</div>
            <div className="warning-content">
              <div className="warning-label">{SEVERITY_LABELS[warning.severity]}</div>
              <div className="warning-message">{warning.message}</div>
            </div>
          </div>
        ))}
      </div>

      {criticalCount > 0 && (
        <div className="warning-action">
          <p>
            🛑 <strong>Critical issues found.</strong> Please review and fix before saving.
          </p>
        </div>
      )}

      {highCount > 0 && criticalCount === 0 && (
        <div className="warning-action warning-action-high">
          <p>
            ⚠️ <strong>High severity issues found.</strong> You can save, but review is recommended.
          </p>
        </div>
      )}
    </div>
  );
}
