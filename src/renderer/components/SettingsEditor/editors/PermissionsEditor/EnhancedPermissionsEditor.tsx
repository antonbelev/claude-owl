import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { PermissionsConfig, PermissionRule, ToolType } from '@/shared/types';
import { PermissionRuleItem } from './PermissionRule';
import { RuleEditorModal } from './RuleEditorModal';
import { RuleTemplatesModal } from './RuleTemplatesModal';
import { RuleTester } from './RuleTester';
import './PermissionsEditor.css';

interface EnhancedPermissionsEditorProps {
  permissions: PermissionsConfig;
  updatePermissions: (permissions: PermissionsConfig) => void;
  readOnly?: boolean;
}

export const EnhancedPermissionsEditor: React.FC<EnhancedPermissionsEditorProps> = ({
  permissions,
  updatePermissions,
  readOnly = false,
}) => {
  const [rules, setRules] = useState<PermissionRule[]>([]);
  const [editingRule, setEditingRule] = useState<PermissionRule | null>(null);
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTester, setShowTester] = useState(false);

  // Convert permissions config to rule array on mount and when permissions change
  useEffect(() => {
    const allRules: PermissionRule[] = [];

    // Parse deny rules
    (permissions.deny || []).forEach(ruleStr => {
      const parts = ruleStr.match(/^(\w+)(?:\((.*)\))?$/);
      if (parts) {
        const rule: PermissionRule = {
          id: uuidv4(),
          tool: parts[1] as ToolType,
          level: 'deny',
          createdFrom: 'custom',
        };
        if (parts[2]) {
          rule.pattern = parts[2];
        }
        allRules.push(rule);
      }
    });

    // Parse ask rules
    (permissions.ask || []).forEach(ruleStr => {
      const parts = ruleStr.match(/^(\w+)(?:\((.*)\))?$/);
      if (parts) {
        const rule: PermissionRule = {
          id: uuidv4(),
          tool: parts[1] as ToolType,
          level: 'ask',
          createdFrom: 'custom',
        };
        if (parts[2]) {
          rule.pattern = parts[2];
        }
        allRules.push(rule);
      }
    });

    // Parse allow rules
    (permissions.allow || []).forEach(ruleStr => {
      const parts = ruleStr.match(/^(\w+)(?:\((.*)\))?$/);
      if (parts) {
        const rule: PermissionRule = {
          id: uuidv4(),
          tool: parts[1] as ToolType,
          level: 'allow',
          createdFrom: 'custom',
        };
        if (parts[2]) {
          rule.pattern = parts[2];
        }
        allRules.push(rule);
      }
    });

    setRules(allRules);
  }, [permissions]);

  // Convert rule array back to permissions config when rules change
  const syncRulesToPermissions = (updatedRules: PermissionRule[]) => {
    const deny: string[] = [];
    const ask: string[] = [];
    const allow: string[] = [];

    updatedRules.forEach(rule => {
      const ruleStr = rule.pattern ? `${rule.tool}(${rule.pattern})` : rule.tool;

      switch (rule.level) {
        case 'deny':
          deny.push(ruleStr);
          break;
        case 'ask':
          ask.push(ruleStr);
          break;
        case 'allow':
          allow.push(ruleStr);
          break;
      }
    });

    updatePermissions({
      ...permissions,
      deny,
      ask,
      allow,
    });
  };

  const handleAddRule = () => {
    setEditingRule(null);
    setShowRuleEditor(true);
  };

  const handleEditRule = (rule: PermissionRule) => {
    setEditingRule(rule);
    setShowRuleEditor(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    const updatedRules = rules.filter(r => r.id !== ruleId);
    setRules(updatedRules);
    syncRulesToPermissions(updatedRules);
  };

  const handleSaveRule = (ruleData: Omit<PermissionRule, 'id'>) => {
    let updatedRules: PermissionRule[];

    if (editingRule) {
      // Update existing rule
      updatedRules = rules.map(r =>
        r.id === editingRule.id ? { ...ruleData, id: editingRule.id } : r
      );
    } else {
      // Add new rule
      updatedRules = [...rules, { ...ruleData, id: uuidv4() }];
    }

    setRules(updatedRules);
    syncRulesToPermissions(updatedRules);
    setShowRuleEditor(false);
    setEditingRule(null);
  };

  const handleApplyTemplate = (templateRules: PermissionRule[]) => {
    const updatedRules = [...rules, ...templateRules];
    setRules(updatedRules);
    syncRulesToPermissions(updatedRules);
    setShowTemplates(false);
  };

  // Group rules by level
  const denyRules = rules.filter(r => r.level === 'deny');
  const askRules = rules.filter(r => r.level === 'ask');
  const allowRules = rules.filter(r => r.level === 'allow');

  return (
    <div className="enhanced-permissions-editor">
      <div className="editor-header">
        <div className="editor-intro">
          <h3>Permission Rules</h3>
          <p>
            Control which tools Claude can use. Rules use patterns like{' '}
            <code>Bash(npm run test)</code> or <code>Read(./secrets/**)</code>.
          </p>
        </div>

        {!readOnly && (
          <div className="editor-actions">
            <button onClick={handleAddRule} className="btn-primary">
              + Add Rule
            </button>
            <button onClick={() => setShowTemplates(true)} className="btn-secondary">
              📋 Templates
            </button>
            <button onClick={() => setShowTester(!showTester)} className="btn-secondary">
              🧪 Test Rules
            </button>
          </div>
        )}
      </div>

      {/* Rule Tester */}
      {showTester && <RuleTester />}

      {/* Deny Rules */}
      <div className="rules-section">
        <div className="section-header">
          <h4 className="section-title deny">🚫 DENY Rules ({denyRules.length})</h4>
          <p className="section-description">Highest priority - always blocked</p>
        </div>
        <div className="rules-list">
          {denyRules.length === 0 && <p className="empty-rules">No deny rules configured</p>}
          {denyRules.map(rule => (
            <PermissionRuleItem
              key={rule.id}
              rule={rule}
              onEdit={() => handleEditRule(rule)}
              onDelete={() => handleDeleteRule(rule.id)}
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>

      {/* Ask Rules */}
      <div className="rules-section">
        <div className="section-header">
          <h4 className="section-title ask">⚠️ ASK Rules ({askRules.length})</h4>
          <p className="section-description">Require confirmation before execution</p>
        </div>
        <div className="rules-list">
          {askRules.length === 0 && <p className="empty-rules">No ask rules configured</p>}
          {askRules.map(rule => (
            <PermissionRuleItem
              key={rule.id}
              rule={rule}
              onEdit={() => handleEditRule(rule)}
              onDelete={() => handleDeleteRule(rule.id)}
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>

      {/* Allow Rules */}
      <div className="rules-section">
        <div className="section-header">
          <h4 className="section-title allow">✅ ALLOW Rules ({allowRules.length})</h4>
          <p className="section-description">Auto-approved operations</p>
        </div>
        <div className="rules-list">
          {allowRules.length === 0 && <p className="empty-rules">No allow rules configured</p>}
          {allowRules.map(rule => (
            <PermissionRuleItem
              key={rule.id}
              rule={rule}
              onEdit={() => handleEditRule(rule)}
              onDelete={() => handleDeleteRule(rule.id)}
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>

      {/* Additional Settings */}
      <div className="additional-settings">
        <h4>Additional Settings</h4>

        <div className="form-group">
          <label htmlFor="additionalDirectories">Additional Directories</label>
          <p className="form-help">Extra working directories accessible to Claude</p>
          <textarea
            id="additionalDirectories"
            value={(permissions.additionalDirectories || []).join('\n')}
            onChange={e =>
              updatePermissions({
                ...permissions,
                additionalDirectories: e.target.value.split('\n').filter(d => d.trim()),
              })
            }
            placeholder="/path/to/directory&#10;/another/path"
            rows={3}
            disabled={readOnly}
          />
        </div>

        <div className="form-group">
          <label htmlFor="defaultMode">Default Permission Mode</label>
          <input
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
          <p className="form-help">
            Initial permission mode (e.g., &quot;acceptEdits&quot;, &quot;bypassPermissions&quot;)
          </p>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={permissions.disableBypassPermissionsMode || false}
              onChange={e =>
                updatePermissions({
                  ...permissions,
                  disableBypassPermissionsMode: e.target.checked,
                })
              }
              disabled={readOnly}
            />
            <span>Disable bypass permissions mode</span>
          </label>
          <p className="form-help">Prevent the --dangerously-skip-permissions flag from working</p>
        </div>
      </div>

      {/* Modals */}
      {showRuleEditor && (
        <RuleEditorModal
          {...(editingRule ? { rule: editingRule } : {})}
          onSave={handleSaveRule}
          onCancel={() => setShowRuleEditor(false)}
        />
      )}

      {showTemplates && (
        <RuleTemplatesModal
          onApply={handleApplyTemplate}
          onCancel={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
};
