import React, { useState } from 'react';
import type { ToolType, PermissionLevel, PermissionRule } from '@/shared/types';
import { usePermissionRules } from '../../../../hooks/usePermissionRules';

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
    <div className="rule-tester">
      <div className="tester-header">
        <h3>🧪 Test Your Rules</h3>
        <p>Test how a rule would match against a specific command or path</p>
      </div>

      <div className="tester-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="test-tool">Tool</label>
            <select id="test-tool" value={tool} onChange={e => setTool(e.target.value as ToolType)}>
              {TOOLS.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="test-level">Level</label>
            <select
              id="test-level"
              value={level}
              onChange={e => setLevel(e.target.value as PermissionLevel)}
            >
              <option value="allow">Allow</option>
              <option value="ask">Ask</option>
              <option value="deny">Deny</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="test-pattern">Pattern</label>
          <input
            id="test-pattern"
            type="text"
            value={pattern}
            onChange={e => setPattern(e.target.value)}
            placeholder="e.g., npm run test"
          />
        </div>

        <div className="form-group">
          <label htmlFor="test-input">Test Input</label>
          <input
            id="test-input"
            type="text"
            value={testInput}
            onChange={e => setTestInput(e.target.value)}
            placeholder="e.g., npm run test:unit"
          />
        </div>

        <button onClick={handleTest} disabled={testing} className="btn-primary">
          {testing ? 'Testing...' : 'Test Rule'}
        </button>
      </div>

      {result && (
        <div className={`test-result ${result.matches ? 'result-match' : 'result-no-match'}`}>
          <div className="result-header">
            <span className="result-icon">{result.matches ? '✅' : '❌'}</span>
            <span className="result-label">{result.matches ? 'MATCHES' : 'DOES NOT MATCH'}</span>
          </div>
          {result.reason && (
            <div className="result-reason">
              <p className="reason-label">Reason:</p>
              <p>{result.reason}</p>
            </div>
          )}
          <div className="result-details">
            <p>
              <strong>Rule:</strong> {tool}
              {pattern && `(${pattern})`} - {level}
            </p>
            <p>
              <strong>Test Input:</strong> <code>{testInput}</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
