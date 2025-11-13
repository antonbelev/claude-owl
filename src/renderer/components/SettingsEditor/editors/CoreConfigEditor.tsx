import React from 'react';
import type { ClaudeSettings } from '@/shared/types';

interface CoreConfigEditorProps {
  settings: ClaudeSettings;
  updateSettings: (settings: Partial<ClaudeSettings>) => void;
  readOnly?: boolean;
}

export const CoreConfigEditor: React.FC<CoreConfigEditorProps> = ({
  settings,
  updateSettings,
  readOnly = false,
}) => {
  return (
    <div className="core-config-editor">
      <div className="editor-section">
        <h3>Model Configuration</h3>
        <div className="form-group">
          <label htmlFor="model">Default Model</label>
          <input
            id="model"
            type="text"
            value={settings.model || ''}
            onChange={e => updateSettings({ model: e.target.value })}
            placeholder="e.g., claude-sonnet-4-5-20250929"
            disabled={readOnly}
          />
          <p className="form-help">Override the default Claude model</p>
        </div>
      </div>

      <div className="editor-section">
        <h3>Output Style</h3>
        <div className="form-group">
          <label htmlFor="outputStyle">Output Style</label>
          <textarea
            id="outputStyle"
            value={settings.outputStyle || ''}
            onChange={e => updateSettings({ outputStyle: e.target.value })}
            placeholder="Custom system prompt to append"
            disabled={readOnly}
            rows={4}
          />
          <p className="form-help">Adjust Claude&apos;s system prompt behavior</p>
        </div>
      </div>

      <div className="editor-section">
        <h3>Authentication</h3>
        <div className="form-group">
          <label htmlFor="apiKeyHelper">API Key Helper Script</label>
          <input
            id="apiKeyHelper"
            type="text"
            value={settings.apiKeyHelper || ''}
            onChange={e => updateSettings({ apiKeyHelper: e.target.value })}
            placeholder="Path to script for generating credentials"
            disabled={readOnly}
          />
          <p className="form-help">Custom credential generation script</p>
        </div>

        <div className="form-group">
          <label htmlFor="forceLoginMethod">Force Login Method</label>
          <select
            id="forceLoginMethod"
            value={settings.forceLoginMethod || ''}
            onChange={e => {
              const value = e.target.value;
              if (value === '') {
                // Remove the property entirely instead of setting to undefined
                const { forceLoginMethod: _removed, ...rest } = settings;
                updateSettings(rest);
              } else {
                updateSettings({
                  forceLoginMethod: value as 'claudeai' | 'console',
                });
              }
            }}
            disabled={readOnly}
          >
            <option value="">No restriction</option>
            <option value="claudeai">Claude.ai</option>
            <option value="console">Anthropic Console</option>
          </select>
          <p className="form-help">Restrict login method to specific account type</p>
        </div>

        <div className="form-group">
          <label htmlFor="forceLoginOrgUUID">Force Organization UUID</label>
          <input
            id="forceLoginOrgUUID"
            type="text"
            value={settings.forceLoginOrgUUID || ''}
            onChange={e => updateSettings({ forceLoginOrgUUID: e.target.value })}
            placeholder="Organization UUID"
            disabled={readOnly}
          />
          <p className="form-help">Auto-select organization during login</p>
        </div>
      </div>

      <div className="editor-section">
        <h3>Maintenance</h3>
        <div className="form-group">
          <label htmlFor="cleanupPeriodDays">Cleanup Period (Days)</label>
          <input
            id="cleanupPeriodDays"
            type="number"
            value={settings.cleanupPeriodDays || 30}
            onChange={e => updateSettings({ cleanupPeriodDays: parseInt(e.target.value) || 30 })}
            min="1"
            disabled={readOnly}
          />
          <p className="form-help">Chat transcript retention period (default: 30 days)</p>
        </div>

        <div className="form-group">
          <label htmlFor="companyAnnouncements">Company Announcements</label>
          <textarea
            id="companyAnnouncements"
            value={settings.companyAnnouncements || ''}
            onChange={e => updateSettings({ companyAnnouncements: e.target.value })}
            placeholder="Startup notifications"
            disabled={readOnly}
            rows={3}
          />
          <p className="form-help">Messages shown on startup</p>
        </div>
      </div>

      <div className="editor-section">
        <h3>Git Integration</h3>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={settings.includeCoAuthoredBy !== false}
              onChange={e => updateSettings({ includeCoAuthoredBy: e.target.checked })}
              disabled={readOnly}
            />
            Include Claude co-authored attribution in commits
          </label>
          <p className="form-help">
            Add &quot;Co-Authored-By: Claude&quot; to git commits (default: true)
          </p>
        </div>
      </div>

      <div className="editor-section">
        <h3>MCP Server Management</h3>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={settings.enableAllProjectMcpServers || false}
              onChange={e => updateSettings({ enableAllProjectMcpServers: e.target.checked })}
              disabled={readOnly}
            />
            Auto-approve all project MCP servers
          </label>
          <p className="form-help">
            Automatically enable all MCP servers defined in project .mcp.json
          </p>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={settings.disableAllHooks || false}
              onChange={e => updateSettings({ disableAllHooks: e.target.checked })}
              disabled={readOnly}
            />
            Disable all hooks
          </label>
          <p className="form-help">Prevent all pre/post tool execution hooks from running</p>
        </div>
      </div>
    </div>
  );
};
