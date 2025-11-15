import React, { useState, useEffect } from 'react';
import type { PermissionRule, ToolType, PermissionLevel } from '@/shared/types';
import { TOOL_PATTERN_HELP, TOOLS_WITHOUT_PATTERNS } from '@/shared/types/permissions.types';
import { usePermissionRules } from '../../../../hooks/usePermissionRules';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/renderer/components/ui/dialog';
import { Button } from '@/renderer/components/ui/button';
import { Input } from '@/renderer/components/ui/input';
import { Label } from '@/renderer/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/renderer/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/renderer/components/ui/radio-group';
import { Alert, AlertDescription } from '@/renderer/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface RuleEditorModalProps {
  rule?: PermissionRule; // If provided, we're editing; otherwise creating
  onSave: (rule: Omit<PermissionRule, 'id'>) => void;
  onCancel: () => void;
  open: boolean;
}

const TOOLS: ToolType[] = [
  'Bash',
  'Read',
  'Edit',
  'Write',
  'WebFetch',
  'WebSearch',
  'NotebookEdit',
  'SlashCommand',
];

export const RuleEditorModal: React.FC<RuleEditorModalProps> = ({
  rule,
  onSave,
  onCancel,
  open,
}) => {
  const { validateRule, validatePattern } = usePermissionRules();

  const [tool, setTool] = useState<ToolType>(rule?.tool || 'Bash');
  const [pattern, setPattern] = useState(rule?.pattern || '');
  const [level, setLevel] = useState<PermissionLevel>(rule?.level || 'allow');
  const [description, setDescription] = useState(rule?.description || '');
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    error?: string;
    warnings?: string[];
    examples?: string[];
  } | null>(null);

  const requiresPattern = !TOOLS_WITHOUT_PATTERNS.includes(tool);
  const helpText = TOOL_PATTERN_HELP[tool];

  // Validate pattern when it changes
  useEffect(() => {
    const validate = async () => {
      if (pattern) {
        const result = await validatePattern(tool, pattern);
        setValidationResult(result);
      } else if (requiresPattern) {
        setValidationResult({
          valid: false,
          error: `${tool} typically requires a pattern`,
        });
      } else {
        setValidationResult({ valid: true });
      }
    };

    validate();
  }, [tool, pattern, requiresPattern, validatePattern]);

  const handleSave = async () => {
    // Build rule object conditionally
    const ruleToValidate: Omit<PermissionRule, 'id'> = {
      tool,
      level,
      createdFrom: rule?.createdFrom || 'custom',
    };

    if (pattern) {
      ruleToValidate.pattern = pattern;
    }

    if (description) {
      ruleToValidate.description = description;
    }

    // Final validation
    const finalValidation = await validateRule(ruleToValidate);

    if (finalValidation && !finalValidation.valid) {
      alert(`Validation failed: ${finalValidation.error}`);
      return;
    }

    onSave(ruleToValidate);
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit Permission Rule' : 'Create Permission Rule'}</DialogTitle>
          <DialogDescription>
            Configure tool permissions for Claude Code with custom patterns
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Permission Level */}
          <div className="space-y-3">
            <Label>Permission Level</Label>
            <RadioGroup value={level} onValueChange={value => setLevel(value as PermissionLevel)}>
              <div className="grid grid-cols-3 gap-4">
                <label
                  className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    level === 'allow'
                      ? 'border-green-500 bg-green-50'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <RadioGroupItem value="allow" id="level-allow" className="sr-only" />
                  <span className="text-2xl">✅</span>
                  <span className="text-sm font-semibold uppercase text-green-700">Allow</span>
                </label>
                <label
                  className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    level === 'ask'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <RadioGroupItem value="ask" id="level-ask" className="sr-only" />
                  <span className="text-2xl">⚠️</span>
                  <span className="text-sm font-semibold uppercase text-amber-700">Ask</span>
                </label>
                <label
                  className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    level === 'deny'
                      ? 'border-red-500 bg-red-50'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <RadioGroupItem value="deny" id="level-deny" className="sr-only" />
                  <span className="text-2xl">🚫</span>
                  <span className="text-sm font-semibold uppercase text-red-700">Deny</span>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Tool Type */}
          <div className="space-y-2">
            <Label htmlFor="tool">Tool Type</Label>
            <Select value={tool} onValueChange={value => setTool(value as ToolType)}>
              <SelectTrigger id="tool">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOOLS.map(t => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {helpText && (
              <p className="text-sm text-neutral-600 flex items-start gap-1">
                <span>ℹ️</span>
                <span>{helpText}</span>
              </p>
            )}
          </div>

          {/* Pattern */}
          <div className="space-y-2">
            <Label htmlFor="pattern">
              Pattern {requiresPattern && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="pattern"
              type="text"
              value={pattern}
              onChange={e => setPattern(e.target.value)}
              placeholder={
                tool === 'Bash'
                  ? 'e.g., npm run test'
                  : tool === 'Read' || tool === 'Edit' || tool === 'Write'
                    ? 'e.g., ./src/**/*.ts'
                    : tool === 'WebFetch'
                      ? 'e.g., domain:anthropic.com'
                      : 'Pattern...'
              }
            />

            {/* Validation Feedback */}
            {validationResult && (
              <Alert variant={validationResult.valid ? 'default' : 'destructive'}>
                {validationResult.valid ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {validationResult.valid && <span>✅ Pattern is valid</span>}
                  {!validationResult.valid && validationResult.error && (
                    <span>❌ {validationResult.error}</span>
                  )}
                  {validationResult.warnings && validationResult.warnings.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {validationResult.warnings.map((warning, idx) => (
                        <div key={idx}>⚠️ {warning}</div>
                      ))}
                    </div>
                  )}
                  {validationResult.examples && validationResult.examples.length > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold mb-1">📋 Example matches:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {validationResult.examples.map((example, idx) => (
                          <li key={idx}>
                            <code className="bg-neutral-100 px-1 py-0.5 rounded text-xs">
                              {example}
                            </code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief note about this rule..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onCancel} variant="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={validationResult ? !validationResult.valid : false}
          >
            {rule ? 'Save Changes' : 'Create Rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
