import { useState, useCallback } from 'react';
import { CommandFrontmatter } from '../../../shared/types/command.types';
import { CommandSecurityWarnings } from './CommandSecurityWarnings';
import { RawMarkdownEditor } from './RawMarkdownEditor';
import { generateCommandMarkdown } from '../../../shared/utils/command-markdown.utils';
import './CommandReviewStep.css';

export interface CommandReviewStepProps {
  name: string;
  location: 'user' | 'project' | 'plugin' | 'mcp';
  namespace?: string;
  frontmatter: CommandFrontmatter;
  content: string;
  onBack: () => void;
  onConfirm: (frontmatter: CommandFrontmatter, content: string) => Promise<void>;
  isLoading: boolean | undefined;
}

interface SecurityWarning {
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
}

export function CommandReviewStep({
  name,
  location,
  namespace,
  frontmatter,
  content,
  onBack,
  onConfirm,
  isLoading,
}: CommandReviewStepProps) {
  const [showRawEditor, setShowRawEditor] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Track potentially edited frontmatter/content from raw editor
  const [currentFrontmatter, setCurrentFrontmatter] = useState(frontmatter);
  const [currentContent, setCurrentContent] = useState(content);

  const generatedMarkdown = generateCommandMarkdown(currentFrontmatter, currentContent);

  const securityWarnings: SecurityWarning[] = [];

  // Check for bash execution without permission
  if (currentContent.includes('!`')) {
    const hasBashPermission = (currentFrontmatter['allowed-tools'] || []).some(tool =>
      tool.startsWith('Bash(')
    );
    if (!hasBashPermission) {
      securityWarnings.push({
        severity: 'critical',
        message: 'Command contains bash execution (!`) but Bash is not in allowed-tools',
      });
    }

    // Check for unquoted variables
    const unquotedVarPattern = /![`][^`]*?\$(?:ARGUMENTS|[1-9])(?!["'])/g;
    if (unquotedVarPattern.test(currentContent)) {
      securityWarnings.push({
        severity: 'high',
        message: 'Unquoted variables in bash execution can be dangerous. Consider quoting variables.',
      });
    }

    // Check for dangerous patterns
    if (/rm\s+-rf|:\(\)\{\s*:\|:&\s*\};:|curl.*\|\s*sh|eval\s+\$/.test(currentContent)) {
      securityWarnings.push({
        severity: 'critical',
        message: 'Potentially dangerous bash pattern detected. Review carefully before saving.',
      });
    }
  }

  // Check for overly permissive tools
  if ((currentFrontmatter['allowed-tools'] || []).includes('Bash(*)')) {
    securityWarnings.push({
      severity: 'high',
      message: 'Bash(*) allows ANY bash command execution. Consider restricting to specific commands.',
    });
  }

  if (
    (currentFrontmatter['allowed-tools'] || []).includes('Write(*)') ||
    (currentFrontmatter['allowed-tools'] || []).includes('Edit(*)')
  ) {
    securityWarnings.push({
      severity: 'high',
      message: 'Write(*) or Edit(*) allows modifying ANY file. Consider restricting to specific paths.',
    });
  }

  const handleConfirm = useCallback(async () => {
    setIsSaving(true);
    try {
      await onConfirm(currentFrontmatter, currentContent);
    } finally {
      setIsSaving(false);
    }
  }, [currentFrontmatter, currentContent, onConfirm]);

  const handleRawSave = useCallback(
    (newFrontmatter: CommandFrontmatter, newContent: string) => {
      // Update the current state with edited values from raw editor
      setCurrentFrontmatter(newFrontmatter);
      setCurrentContent(newContent);
      setShowRawEditor(false);
    },
    []
  );

  return (
    <div className="command-review-step">
      <div className="review-container">
        <div className="review-summary">
          <h3>Command Summary</h3>

          <div className="summary-item">
            <div className="summary-label">Command Name</div>
            <div className="summary-value">/{namespace ? `${namespace}:` : ''}{name}</div>
          </div>

          <div className="summary-item">
            <div className="summary-label">Description</div>
            <div className="summary-value">{currentFrontmatter.description}</div>
          </div>

          <div className="summary-item">
            <div className="summary-label">Location</div>
            <div className="summary-value">
              {location === 'user' && '📁 User (~/.claude/commands/)'}
              {location === 'project' && '📁 Project (.claude/commands/)'}
              {location === 'plugin' && '🔌 Plugin (read-only)'}
              {location === 'mcp' && '🔗 MCP (read-only)'}
            </div>
          </div>

          {namespace && (
            <div className="summary-item">
              <div className="summary-label">Namespace</div>
              <div className="summary-value">🏷️ {namespace}</div>
            </div>
          )}
        </div>

        <div className="review-markdown">
          <div className="markdown-header">
            <h3>Generated Markdown</h3>
            <div className="markdown-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(generatedMarkdown);
                }}
                title="Copy to clipboard"
              >
                📋 Copy
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowRawEditor(true)}
                title="Edit raw markdown"
              >
                ✎ Edit Raw
              </button>
            </div>
          </div>

          <div className="markdown-preview">
            <pre className="markdown-code">{generatedMarkdown}</pre>
          </div>
        </div>

        {securityWarnings.length > 0 && <CommandSecurityWarnings warnings={securityWarnings} />}

        {securityWarnings.length === 0 && (
          <div className="security-clear">✅ No security issues detected</div>
        )}
      </div>

      <div className="review-footer">
        <button onClick={onBack} className="btn-secondary" disabled={isSaving || isLoading}>
          Back
        </button>
        <button
          onClick={handleConfirm}
          className="btn-primary"
          disabled={isSaving || isLoading}
        >
          {isSaving ? 'Creating...' : 'Create Command'}
        </button>
      </div>

      {showRawEditor && (
        <RawMarkdownEditor
          markdown={generatedMarkdown}
          onSave={handleRawSave}
          onCancel={() => setShowRawEditor(false)}
        />
      )}
    </div>
  );
}
