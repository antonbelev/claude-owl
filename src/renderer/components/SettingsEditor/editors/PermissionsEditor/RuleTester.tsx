import React, { useState } from 'react';
import type { ToolType, PermissionLevel, PermissionRule } from '@/shared/types';
import { usePermissionRules } from '../../../../hooks/usePermissionRules';
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
import { Alert, AlertDescription } from '@/renderer/components/ui/alert';
import { FlaskConical, CheckCircle2, XCircle } from 'lucide-react';

const TOOLS: ToolType[] = ['Bash', 'Read', 'Edit', 'Write', 'WebFetch', 'SlashCommand'];

export const RuleTester: React.FC = () => {
  const { testRule } = usePermissionRules();

  const [tool, setTool] = useState<ToolType>('Bash');
  const [pattern, setPattern] = useState('npm run test');
  const [testInput, setTestInput] = useState('npm run test:unit');
  const [level, setLevel] = useState<PermissionLevel>('allow');
  const [result, setResult] = useState<{ matches: boolean; reason?: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);

    try {
      const ruleToTest: Omit<PermissionRule, 'id'> = {
        tool,
        level,
        createdFrom: 'custom',
      };

      if (pattern) {
        ruleToTest.pattern = pattern;
      }

      const testResult = await testRule(ruleToTest, testInput);

      setResult(testResult);
    } catch (error) {
      console.error('Failed to test rule:', error);
      setResult({
        matches: false,
        reason: 'Test failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
          <FlaskConical className="h-5 w-5" />
          Test Your Rules
        </h3>
        <p className="text-sm text-neutral-600">
          Test how a rule would match against a specific command or path
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="test-tool">Tool</Label>
            <Select value={tool} onValueChange={value => setTool(value as ToolType)}>
              <SelectTrigger id="test-tool">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-level">Level</Label>
            <Select value={level} onValueChange={value => setLevel(value as PermissionLevel)}>
              <SelectTrigger id="test-level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="allow">Allow</SelectItem>
                <SelectItem value="ask">Ask</SelectItem>
                <SelectItem value="deny">Deny</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="test-pattern">Pattern</Label>
          <Input
            id="test-pattern"
            type="text"
            value={pattern}
            onChange={e => setPattern(e.target.value)}
            placeholder="e.g., npm run test"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="test-input">Test Input</Label>
          <Input
            id="test-input"
            type="text"
            value={testInput}
            onChange={e => setTestInput(e.target.value)}
            placeholder="e.g., npm run test:unit"
          />
        </div>

        <Button onClick={handleTest} disabled={testing} className="w-full">
          {testing ? 'Testing...' : 'Test Rule'}
        </Button>
      </div>

      {result && (
        <Alert
          variant={result.matches ? 'default' : 'destructive'}
          className="mt-4"
        >
          {result.matches ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">
                  {result.matches ? 'MATCHES' : 'DOES NOT MATCH'}
                </span>
              </div>
              {result.reason && (
                <div>
                  <p className="font-semibold mb-1">Reason:</p>
                  <p className="text-sm">{result.reason}</p>
                </div>
              )}
              <div className="bg-neutral-50 p-3 rounded-md text-sm space-y-1">
                <p>
                  <strong>Rule:</strong> {tool}
                  {pattern && `(${pattern})`} - {level}
                </p>
                <p>
                  <strong>Test Input:</strong> <code className="bg-white px-1 py-0.5 rounded">{testInput}</code>
                </p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
