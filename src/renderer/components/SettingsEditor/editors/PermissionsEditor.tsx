import React, { useState } from 'react';
import type { PermissionsConfig } from '@/shared/types';
import { Input } from '@/renderer/components/ui/input';
import { Button } from '@/renderer/components/ui/button';
import { Label } from '@/renderer/components/ui/label';
import { Checkbox } from '@/renderer/components/ui/checkbox';
import { X } from 'lucide-react';

interface PermissionsEditorProps {
  permissions: PermissionsConfig;
  updatePermissions: (permissions: PermissionsConfig) => void;
  readOnly?: boolean;
}

export const PermissionsEditor: React.FC<PermissionsEditorProps> = ({
  permissions,
  updatePermissions,
  readOnly = false,
}) => {
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
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-neutral-700">
          Permissions control which tools Claude can use. Rules use patterns like{' '}
          <code className="bg-white px-1 py-0.5 rounded text-sm">Read(./secrets/**)</code> or{' '}
          <code className="bg-white px-1 py-0.5 rounded text-sm">Bash(curl:*)</code>.
        </p>
      </div>

      {/* Allow Rules */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-green-700">Allow Rules</h3>
          <p className="text-sm text-neutral-600">Tools and commands that are always permitted</p>
        </div>

        <div className="space-y-2">
          {(permissions.allow || []).map((rule, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2"
            >
              <code className="text-sm text-neutral-800">{rule}</code>
              {!readOnly && (
                <Button
                  onClick={() => removeRule('allow', index)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  title="Remove rule"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {!readOnly && (
          <div className="flex gap-2">
            <Input
              type="text"
              value={newAllowRule}
              onChange={e => setNewAllowRule(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  addRule('allow', newAllowRule);
                }
              }}
              placeholder="e.g., Read(./src/**), Bash(git:*)"
              className="flex-1"
            />
            <Button onClick={() => addRule('allow', newAllowRule)}>Add Allow Rule</Button>
          </div>
        )}
      </div>

      {/* Deny Rules */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-red-700">Deny Rules</h3>
          <p className="text-sm text-neutral-600">Tools and commands that are always blocked</p>
        </div>

        <div className="space-y-2">
          {(permissions.deny || []).map((rule, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-red-50 border border-red-200 rounded-md px-3 py-2"
            >
              <code className="text-sm text-neutral-800">{rule}</code>
              {!readOnly && (
                <Button
                  onClick={() => removeRule('deny', index)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  title="Remove rule"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {!readOnly && (
          <div className="flex gap-2">
            <Input
              type="text"
              value={newDenyRule}
              onChange={e => setNewDenyRule(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  addRule('deny', newDenyRule);
                }
              }}
              placeholder="e.g., Read(./.env), Bash(curl:*)"
              className="flex-1"
            />
            <Button onClick={() => addRule('deny', newDenyRule)}>Add Deny Rule</Button>
          </div>
        )}
      </div>

      {/* Ask Rules */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-amber-700">Ask Rules</h3>
          <p className="text-sm text-neutral-600">
            Tools and commands that require confirmation before execution
          </p>
        </div>

        <div className="space-y-2">
          {(permissions.ask || []).map((rule, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-md px-3 py-2"
            >
              <code className="text-sm text-neutral-800">{rule}</code>
              {!readOnly && (
                <Button
                  onClick={() => removeRule('ask', index)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  title="Remove rule"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {!readOnly && (
          <div className="flex gap-2">
            <Input
              type="text"
              value={newAskRule}
              onChange={e => setNewAskRule(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  addRule('ask', newAskRule);
                }
              }}
              placeholder="e.g., Write(**), Bash(rm:*)"
              className="flex-1"
            />
            <Button onClick={() => addRule('ask', newAskRule)}>Add Ask Rule</Button>
          </div>
        )}
      </div>

      {/* Additional Directories */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Additional Directories</h3>
          <p className="text-sm text-neutral-600">Extra working directories accessible to Claude</p>
        </div>

        <div className="space-y-2">
          {(permissions.additionalDirectories || []).map((dir, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2"
            >
              <code className="text-sm text-neutral-800">{dir}</code>
              {!readOnly && (
                <Button
                  onClick={() => removeDirectory(index)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  title="Remove directory"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {!readOnly && (
          <div className="flex gap-2">
            <Input
              type="text"
              value={newDirectory}
              onChange={e => setNewDirectory(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter') {
                  addDirectory(newDirectory);
                }
              }}
              placeholder="/path/to/directory"
              className="flex-1"
            />
            <Button onClick={() => addDirectory(newDirectory)}>Add Directory</Button>
          </div>
        )}
      </div>

      {/* Default Mode */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Permission Mode</h3>
        <div className="space-y-2">
          <Label htmlFor="defaultMode">Default Permission Mode</Label>
          <Input
            id="defaultMode"
            type="text"
            value={permissions.defaultMode || ''}
            onChange={e =>
              updatePermissions({
                ...permissions,
                defaultMode: e.target.value,
              })
            }
            placeholder="e.g., acceptEdits"
            disabled={readOnly}
          />
          <p className="text-sm text-neutral-600">
            Initial permission mode (e.g., &quot;acceptEdits&quot;)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="disableBypassPermissionsMode"
            checked={permissions.disableBypassPermissionsMode === 'disable'}
            onCheckedChange={checked => {
              const { disableBypassPermissionsMode, ...rest } = permissions;
              updatePermissions({
                ...rest,
                ...(checked && { disableBypassPermissionsMode: 'disable' }),
              });
            }}
            disabled={readOnly}
          />
          <Label
            htmlFor="disableBypassPermissionsMode"
            className="text-sm font-normal cursor-pointer"
          >
            Disable bypass permissions mode
          </Label>
        </div>
        <p className="text-sm text-neutral-600 ml-6">
          Prevent the --dangerously-skip-permissions flag from working
        </p>
      </div>
    </div>
  );
};
