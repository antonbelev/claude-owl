/**
 * SecurityWarningBanner - Prominent security warning for hooks
 *
 * Displays critical security information at the top of Hooks Manager
 */

export function SecurityWarningBanner() {
  return (
    <div className="security-warning">
      <div className="security-warning-content">
        <div className="security-warning-icon">⚠️</div>
        <div style={{ flex: 1 }}>
          <h3 className="security-warning-title">Security Warning</h3>

          <div className="security-warning-text">
            <p>
              Claude Code hooks execute arbitrary commands on your system automatically during agent
              operations. Hooks run with your current environment&apos;s credentials.
            </p>

            <div style={{ marginTop: '0.75rem' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Malicious hooks can:</p>
              <ul>
                <li>Exfiltrate your data</li>
                <li>Modify or delete files</li>
                <li>Execute unauthorized commands</li>
                <li>Compromise your system security</li>
              </ul>
            </div>

            <div className="security-warning-box">
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Before creating or enabling hooks:</p>
              <ul>
                <li>Always review hook code carefully</li>
                <li>Only use hooks from trusted sources</li>
                <li>Understand what each command does</li>
                <li>Test hooks in safe environments first</li>
              </ul>
            </div>

            <p style={{ marginTop: '0.75rem' }}>
              For detailed security best practices, see{' '}
              <button
                className="security-warning-link"
                onClick={() => {
                  window.electronAPI.openExternal('https://code.claude.com/docs/en/hooks');
                }}
              >
                Claude Code Hooks Documentation
              </button>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
