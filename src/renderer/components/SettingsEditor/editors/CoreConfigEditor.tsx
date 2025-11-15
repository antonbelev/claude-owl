import React from 'react';
import type { ClaudeSettings } from '@/shared/types';
import { Input } from '@/renderer/components/ui/input';
import { Textarea } from '@/renderer/components/ui/textarea';
import { Label } from '@/renderer/components/ui/label';
import { Checkbox } from '@/renderer/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/renderer/components/ui/select';

interface CoreConfigEditorProps {
  settings: ClaudeSettings;
  updateSettings: (settings: Partial<ClaudeSettings>) => void;
  readOnly?: boolean;
}

const AVAILABLE_MODELS = [
  { value: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5 (Default)' },
  { value: 'claude-opus-4-1-20250805', label: 'Claude Opus 4.1' },
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
];

export const CoreConfigEditor: React.FC<CoreConfigEditorProps> = ({
  settings,
  updateSettings,
  readOnly = false,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Model Configuration</h3>
        <div className="space-y-2">
          <Label htmlFor="model">Default Model</Label>
          <Select
            value={settings.model || '__default__'}
            onValueChange={value => {
              if (value === '__default__') {
                const { model: _removed, ...rest } = settings;
                updateSettings(rest);
              } else {
                updateSettings({ model: value });
              }
            }}
            disabled={readOnly}
          >
            <SelectTrigger id="model">
              <SelectValue placeholder="Select a model (default: Sonnet 4.5)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__default__">Use default</SelectItem>
              {AVAILABLE_MODELS.map(model => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-neutral-600">Override the default Claude model</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Output Style</h3>
        <div className="space-y-2">
          <Label htmlFor="outputStyle">Output Style</Label>
          <Textarea
            id="outputStyle"
            value={settings.outputStyle || ''}
            onChange={e => updateSettings({ outputStyle: e.target.value })}
            placeholder="Custom system prompt to append"
            disabled={readOnly}
            rows={4}
          />
          <p className="text-sm text-neutral-600">Adjust Claude&apos;s system prompt behavior</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Authentication</h3>
        <div className="space-y-2">
          <Label htmlFor="apiKeyHelper">API Key Helper Script</Label>
          <Input
            id="apiKeyHelper"
            type="text"
            value={settings.apiKeyHelper || ''}
            onChange={e => updateSettings({ apiKeyHelper: e.target.value })}
            placeholder="Path to script for generating credentials"
            disabled={readOnly}
          />
          <p className="text-sm text-neutral-600">Custom credential generation script</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="forceLoginMethod">Force Login Method</Label>
          <Select
            value={settings.forceLoginMethod || '__none__'}
            onValueChange={value => {
              if (value === '__none__') {
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
            <SelectTrigger id="forceLoginMethod">
              <SelectValue placeholder="No restriction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No restriction</SelectItem>
              <SelectItem value="claudeai">Claude.ai</SelectItem>
              <SelectItem value="console">Anthropic Console</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-neutral-600">Restrict login method to specific account type</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="forceLoginOrgUUID">Force Organization UUID</Label>
          <Input
            id="forceLoginOrgUUID"
            type="text"
            value={settings.forceLoginOrgUUID || ''}
            onChange={e => updateSettings({ forceLoginOrgUUID: e.target.value })}
            placeholder="Organization UUID"
            disabled={readOnly}
          />
          <p className="text-sm text-neutral-600">Auto-select organization during login</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Maintenance</h3>
        <div className="space-y-2">
          <Label htmlFor="cleanupPeriodDays">Cleanup Period (Days)</Label>
          <Input
            id="cleanupPeriodDays"
            type="number"
            value={settings.cleanupPeriodDays || 30}
            onChange={e => updateSettings({ cleanupPeriodDays: parseInt(e.target.value) || 30 })}
            min={1}
            disabled={readOnly}
          />
          <p className="text-sm text-neutral-600">
            Chat transcript retention period (default: 30 days)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyAnnouncements">Company Announcements</Label>
          <Textarea
            id="companyAnnouncements"
            value={settings.companyAnnouncements || ''}
            onChange={e => updateSettings({ companyAnnouncements: e.target.value })}
            placeholder="Startup notifications"
            disabled={readOnly}
            rows={3}
          />
          <p className="text-sm text-neutral-600">Messages shown on startup</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Git Integration</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="includeCoAuthoredBy"
            checked={settings.includeCoAuthoredBy !== false}
            onCheckedChange={checked => updateSettings({ includeCoAuthoredBy: checked as boolean })}
            disabled={readOnly}
          />
          <Label htmlFor="includeCoAuthoredBy" className="text-sm font-normal cursor-pointer">
            Include Claude co-authored attribution in commits
          </Label>
        </div>
        <p className="text-sm text-neutral-600 ml-6">
          Add &quot;Co-Authored-By: Claude&quot; to git commits (default: true)
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">MCP Server Management</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enableAllProjectMcpServers"
              checked={settings.enableAllProjectMcpServers || false}
              onCheckedChange={checked =>
                updateSettings({ enableAllProjectMcpServers: checked as boolean })
              }
              disabled={readOnly}
            />
            <Label
              htmlFor="enableAllProjectMcpServers"
              className="text-sm font-normal cursor-pointer"
            >
              Auto-approve all project MCP servers
            </Label>
          </div>
          <p className="text-sm text-neutral-600 ml-6">
            Automatically enable all MCP servers defined in project .mcp.json
          </p>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="disableAllHooks"
              checked={settings.disableAllHooks || false}
              onCheckedChange={checked => updateSettings({ disableAllHooks: checked as boolean })}
              disabled={readOnly}
            />
            <Label htmlFor="disableAllHooks" className="text-sm font-normal cursor-pointer">
              Disable all hooks
            </Label>
          </div>
          <p className="text-sm text-neutral-600 ml-6">
            Prevent all pre/post tool execution hooks from running
          </p>
        </div>
      </div>
    </div>
  );
};
