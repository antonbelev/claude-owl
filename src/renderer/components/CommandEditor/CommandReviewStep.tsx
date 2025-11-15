import { useState, useCallback } from 'react';
import { Folder, Tag, Clipboard, Edit, CheckCircle } from 'lucide-react';
import { CommandFrontmatter } from '../../../shared/types/command.types';
import { CommandSecurityWarnings } from './CommandSecurityWarnings';
import { RawMarkdownEditor } from './RawMarkdownEditor';
import { generateCommandMarkdown } from '../../../shared/utils/command-markdown.utils';
import { Button } from '@/renderer/components/ui/button';
import { Badge } from '@/renderer/components/ui/badge';
import { Card, CardContent } from '@/renderer/components/ui/card';
import { Alert, AlertDescription } from '@/renderer/components/ui/alert';

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
        message:
          'Unquoted variables in bash execution can be dangerous. Consider quoting variables.',
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
      message:
        'Bash(*) allows ANY bash command execution. Consider restricting to specific commands.',
    });
  }

  if (
    (currentFrontmatter['allowed-tools'] || []).includes('Write(*)') ||
    (currentFrontmatter['allowed-tools'] || []).includes('Edit(*)')
  ) {
    securityWarnings.push({
      severity: 'high',
      message:
        'Write(*) or Edit(*) allows modifying ANY file. Consider restricting to specific paths.',
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

  const handleRawSave = useCallback((newFrontmatter: CommandFrontmatter, newContent: string) => {
    // Update the current state with edited values from raw editor
    setCurrentFrontmatter(newFrontmatter);
    setCurrentContent(newContent);
    setShowRawEditor(false);
  }, []);

  const getLocationIcon = () => {
    switch (location) {
      case 'user':
        return <Folder className="h-4 w-4" />;
      case 'project':
        return <Folder className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getLocationLabel = () => {
    switch (location) {
      case 'user':
        return 'User (~/.claude/commands/)';
      case 'project':
        return 'Project (.claude/commands/)';
      case 'plugin':
        return 'Plugin (read-only)';
      case 'mcp':
        return 'MCP (read-only)';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-base">Command Summary</h3>

          <div className="grid gap-4">
            <div>
              <div className="text-sm font-medium text-neutral-700 mb-1">Command Name</div>
              <div className="text-base">
                /{namespace ? `${namespace}:` : ''}
                {name}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-neutral-700 mb-1">Description</div>
              <div className="text-base">{currentFrontmatter.description}</div>
            </div>

            <div>
              <div className="text-sm font-medium text-neutral-700 mb-1">Location</div>
              <div className="flex items-center gap-2">
                {getLocationIcon()}
                <span>{getLocationLabel()}</span>
              </div>
            </div>

            {namespace && (
              <div>
                <div className="text-sm font-medium text-neutral-700 mb-1">Namespace</div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span>{namespace}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base">Generated Markdown</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(generatedMarkdown);
                }}
                title="Copy to clipboard"
              >
                <Clipboard className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRawEditor(true)}
                title="Edit raw markdown"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Raw
              </Button>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-neutral-100 font-mono whitespace-pre">
              {generatedMarkdown}
            </pre>
          </div>
        </CardContent>
      </Card>

      {securityWarnings.length > 0 && <CommandSecurityWarnings warnings={securityWarnings} />}

      {securityWarnings.length === 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>No security issues detected</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between gap-4 pt-4">
        <Button onClick={onBack} variant="outline" disabled={isSaving || isLoading}>
          Back
        </Button>
        <Button onClick={handleConfirm} disabled={isSaving || isLoading}>
          {isSaving ? 'Creating...' : 'Create Command'}
        </Button>
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
