import React, { useState } from 'react';
import type { PermissionsConfig } from '@/shared/types';

interface PermissionsEditorProps {
  permissions: PermissionsConfig;
  updatePermissions: (permissions: PermissionsConfig) => void;
  readOnly?: boolean;
}

export const PermissionsEditor: React.FC<PermissionsEditorProps> = ({ permissions, updatePermissions, readOnly = false }) => {
  const [newAllowRule, setNewAllowRule] = useState('');
  const [newDenyRule, setNewDenyRule] = useState('');
  const [newAskRule, setNewAskRule] = useState('');
  const [newDirectory, setNewDirectory] = useState('');

  const addRule = (type: 'allow' | 'deny' | 'ask', rule: string) => {
    if (!rule.trim()) return;

    const currentRules = permissions[type] || [];
    updatePermissions({
      ...permissions,
      [type]: [...currentRules, rule.trim()],
    });

    // Clear input
    if (type === 'allow') setNewAllowRule('');
    if (type === 'deny') setNewDenyRule('');
    if (type === 'ask') setNewAskRule('');
  };

  const removeRule = (type: 'allow' | 'deny' | 'ask', index: number) => {
    const currentRules = permissions[type] || [];
    updatePermissions({
      ...permissions,
      [type]: currentRules.filter((_, i) => i !== index),
    });
  };

  const addDirectory = (dir: string) => {
    if (!dir.trim()) return;

    const currentDirs = permissions.additionalDirectories || [];
    updatePermissions({
      ...permissions,
      additionalDirectories: [...currentDirs, dir.trim()],
    });

    setNewDirectory('');
  };

  const removeDirectory = (index: number) => {
    const currentDirs = permissions.additionalDirectories || [];
    updatePermissions({
      ...permissions,
      additionalDirectories: currentDirs.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="permissions-editor">
      <div className="editor-intro">
        <p>
          Permissions control which tools Claude can use. Rules use patterns like <code>Read(./secrets/**)</code> or{' '}
          <code>Bash(curl:*)</code>.
        </p>
      </div>

      {/* Allow Rules */}
      <div className="editor-section">
        <h3>Allow Rules</h3>
        <p className="section-help">Tools and commands that are always permitted</p>

        <div className="rules-list">
          {(permissions.allow || []).map((rule, index) => (
            <div key={index} className="rule-item">
              <code>{rule}</code>
              {!readOnly && (
                <button onClick={() => removeRule('allow', index)} className="btn-remove" title="Remove rule">
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {!readOnly && (
          <div className="add-rule">
            <input
              type="text"
              value={newAllowRule}
              onChange={(e) => setNewAllowRule(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addRule('allow', newAllowRule);
                }
              }}
              placeholder='e.g., Read(./src/**), Bash(git:*)'
            />
            <button onClick={() => addRule('allow', newAllowRule)} className="btn-add">
              Add Allow Rule
            </button>
          </div>
        )}
      </div>

      {/* Deny Rules */}
      <div className="editor-section">
        <h3>Deny Rules</h3>
        <p className="section-help">Tools and commands that are always blocked</p>

        <div className="rules-list">
          {(permissions.deny || []).map((rule, index) => (
            <div key={index} className="rule-item">
              <code>{rule}</code>
              {!readOnly && (
                <button onClick={() => removeRule('deny', index)} className="btn-remove" title="Remove rule">
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {!readOnly && (
          <div className="add-rule">
            <input
              type="text"
              value={newDenyRule}
              onChange={(e) => setNewDenyRule(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addRule('deny', newDenyRule);
                }
              }}
              placeholder='e.g., Read(./.env), Bash(curl:*)'
            />
            <button onClick={() => addRule('deny', newDenyRule)} className="btn-add">
              Add Deny Rule
            </button>
          </div>
        )}
      </div>

      {/* Ask Rules */}
      <div className="editor-section">
        <h3>Ask Rules</h3>
        <p className="section-help">Tools and commands that require confirmation before execution</p>

        <div className="rules-list">
          {(permissions.ask || []).map((rule, index) => (
            <div key={index} className="rule-item">
              <code>{rule}</code>
              {!readOnly && (
                <button onClick={() => removeRule('ask', index)} className="btn-remove" title="Remove rule">
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {!readOnly && (
          <div className="add-rule">
            <input
              type="text"
              value={newAskRule}
              onChange={(e) => setNewAskRule(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addRule('ask', newAskRule);
                }
              }}
              placeholder='e.g., Write(**), Bash(rm:*)'
            />
            <button onClick={() => addRule('ask', newAskRule)} className="btn-add">
              Add Ask Rule
            </button>
          </div>
        )}
      </div>

      {/* Additional Directories */}
      <div className="editor-section">
        <h3>Additional Directories</h3>
        <p className="section-help">Extra working directories accessible to Claude</p>

        <div className="rules-list">
          {(permissions.additionalDirectories || []).map((dir, index) => (
            <div key={index} className="rule-item">
              <code>{dir}</code>
              {!readOnly && (
                <button onClick={() => removeDirectory(index)} className="btn-remove" title="Remove directory">
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {!readOnly && (
          <div className="add-rule">
            <input
              type="text"
              value={newDirectory}
              onChange={(e) => setNewDirectory(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addDirectory(newDirectory);
                }
              }}
              placeholder='/path/to/directory'
            />
            <button onClick={() => addDirectory(newDirectory)} className="btn-add">
              Add Directory
            </button>
          </div>
        )}
      </div>

      {/* Default Mode */}
      <div className="editor-section">
        <h3>Permission Mode</h3>
        <div className="form-group">
          <label htmlFor="defaultMode">Default Permission Mode</label>
          <input
            id="defaultMode"
            type="text"
            value={permissions.defaultMode || ''}
            onChange={(e) =>
              updatePermissions({
                ...permissions,
                defaultMode: e.target.value,
              })
            }
            placeholder='e.g., acceptEdits'
            disabled={readOnly}
          />
          <p className="form-help">Initial permission mode (e.g., &quot;acceptEdits&quot;)</p>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={permissions.disableBypassPermissionsMode || false}
              onChange={(e) =>
                updatePermissions({
                  ...permissions,
                  disableBypassPermissionsMode: e.target.checked,
                })
              }
              disabled={readOnly}
            />
            Disable bypass permissions mode
          </label>
          <p className="form-help">Prevent the --dangerously-skip-permissions flag from working</p>
        </div>
      </div>
    </div>
  );
};
