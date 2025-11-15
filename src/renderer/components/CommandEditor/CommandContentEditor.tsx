import { useRef, useCallback } from 'react';
import { Terminal, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/renderer/components/ui/button';
import { Textarea } from '@/renderer/components/ui/textarea';
import { Alert, AlertDescription } from '@/renderer/components/ui/alert';
import { Badge } from '@/renderer/components/ui/badge';

export interface CommandContentEditorProps {
  content: string;
  onChange: (content: string) => void;
  rawMode?: boolean;
  allowedTools?: string[];
}

export function CommandContentEditor({
  content,
  onChange,
  rawMode = false,
  allowedTools = [],
}: CommandContentEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertVariable = useCallback(
    (variable: string) => {
      if (!textareaRef.current) return;

      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + variable + content.substring(end);

      onChange(newContent);

      // Move cursor after inserted variable
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + variable.length;
        textarea.focus();
      }, 0);
    },
    [content, onChange]
  );

  const insertBashTemplate = useCallback(() => {
    const template = '!`your-command here`';
    insertVariable(template);
  }, [insertVariable]);

  const insertFileReference = useCallback(() => {
    const template = '@path/to/file';
    insertVariable(template);
  }, [insertVariable]);

  const hasBashTool = allowedTools.some(tool => tool.startsWith('Bash('));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center p-4 bg-neutral-50 rounded-lg border border-neutral-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-700">Insert Variable:</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => insertVariable('$ARGUMENTS')}
              title="All arguments as single string"
            >
              $ARGUMENTS
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => insertVariable('$1')}
              title="First argument"
            >
              $1
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => insertVariable('$2')}
              title="Second argument"
            >
              $2
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => insertVariable('$3')}
              title="Third argument"
            >
              $3
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-700">Insert:</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={insertBashTemplate}
              title="Insert bash execution template"
              disabled={!hasBashTool && !rawMode}
            >
              <Terminal className="h-3 w-3 mr-1" />
              bash
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={insertFileReference}
              title="Insert file reference"
            >
              <FileText className="h-3 w-3 mr-1" />
              file
            </Button>
          </div>
        </div>
      </div>

      <Textarea
        ref={textareaRef}
        value={content}
        onChange={e => onChange(e.target.value)}
        className={`min-h-[300px] font-mono text-sm ${rawMode ? 'bg-neutral-50' : ''}`}
        placeholder={
          rawMode
            ? `---
description: Your command description
---

Your command content here.

Use $1, $2, etc. for arguments.
Use !\`command\` for bash execution.
Use @file for file references.`
            : 'Write your command content here. Use the buttons above to insert variables.'
        }
        spellCheck="false"
      />

      {!rawMode && (
        <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
          <h4 className="font-semibold text-sm mb-3">Syntax Guide</h4>
          <ul className="space-y-2 text-sm text-neutral-700">
            <li className="flex items-start gap-2">
              <Badge variant="secondary" className="font-mono text-xs">
                $ARGUMENTS
              </Badge>
              <span>All arguments as one string</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="secondary" className="font-mono text-xs">
                $1, $2, $3, ...
              </Badge>
              <span>Individual arguments</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="secondary" className="font-mono text-xs">
                !`git status`
              </Badge>
              <span>Execute bash command</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="secondary" className="font-mono text-xs">
                @src/main.ts
              </Badge>
              <span>Include file contents</span>
            </li>
          </ul>

          {hasBashTool && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Bash execution is enabled (Bash tool configured)</AlertDescription>
            </Alert>
          )}
          {!hasBashTool && content.includes('!`') && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your content has bash execution (!`) but Bash tool is not configured
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
