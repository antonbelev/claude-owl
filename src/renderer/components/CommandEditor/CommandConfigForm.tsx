import { useState } from 'react';
import { CommandToolSelector } from './CommandToolSelector';
import { Input } from '@/renderer/components/ui/input';
import { Textarea } from '@/renderer/components/ui/textarea';
import { Label } from '@/renderer/components/ui/label';
import { Button } from '@/renderer/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/renderer/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/renderer/components/ui/select';
import { Checkbox } from '@/renderer/components/ui/checkbox';
import { Alert, AlertDescription } from '@/renderer/components/ui/alert';
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

export interface CommandConfigFormProps {
  name: string;
  description: string;
  argumentHint: string;
  model: 'sonnet' | 'opus' | 'haiku' | 'default';
  allowedTools: string[];
  disableModelInvocation: boolean;
  location: 'user' | 'project' | 'plugin' | 'mcp';
  namespace: string;
  content: string;
  errors: string[];
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onArgumentHintChange: (hint: string) => void;
  onModelChange: (model: string) => void;
  onToolsChange: (tools: string[]) => void;
  onDisableModelInvocationChange: (disabled: boolean) => void;
  onLocationChange: (location: 'user' | 'project') => void;
  onNamespaceChange: (namespace: string) => void;
  onContentChange: (content: string) => void;
}

export function CommandConfigForm({
  name,
  description,
  argumentHint,
  model,
  allowedTools,
  disableModelInvocation,
  location,
  namespace,
  content,
  errors,
  onNameChange,
  onDescriptionChange,
  onArgumentHintChange,
  onModelChange,
  onToolsChange,
  onDisableModelInvocationChange,
  onLocationChange,
  onNamespaceChange,
  onContentChange,
}: CommandConfigFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const insertAtCursor = (text: string) => {
    const textarea = document.getElementById('command-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const newContent = content.substring(0, start) + text + content.substring(start);
      onContentChange(newContent);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
      }, 0);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Section */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

        <div className="space-y-2">
          <Label htmlFor="command-name">
            Command Name <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center border border-input rounded-md overflow-hidden">
            <span className="flex items-center justify-center w-10 bg-gray-100 text-gray-600 font-semibold border-r border-input">
              /
            </span>
            <Input
              id="command-name"
              type="text"
              value={name}
              onChange={e => onNameChange(e.target.value)}
              placeholder="my-command"
              className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <p className="text-sm text-gray-500">
            Use lowercase letters, numbers, and hyphens (e.g., <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">review-pr</code>)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={e => onDescriptionChange(e.target.value)}
            placeholder="Brief description of what this command does"
            rows={3}
          />
          <p className="text-sm text-gray-500">
            This is shown in Claude Code when users type <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/{name || 'command'}</code>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="argument-hint">Argument Hint</Label>
          <Input
            id="argument-hint"
            type="text"
            value={argumentHint}
            onChange={e => onArgumentHintChange(e.target.value)}
            placeholder="[branch-name] [message]"
          />
          <p className="text-sm text-gray-500">Optional hint showing what arguments the command expects</p>
        </div>
      </div>

      {/* Location & Namespace Section */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Storage & Organization</h3>

        <div className="space-y-2">
          <Label>Location</Label>
          <RadioGroup value={location} onValueChange={(v: string) => onLocationChange(v as 'user' | 'project')}>
            <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="user" id="location-user" />
              <Label htmlFor="location-user" className="cursor-pointer font-normal flex-1">
                User Commands (<code className="text-xs">~/.claude/commands/</code>)
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="project" id="location-project" />
              <Label htmlFor="location-project" className="cursor-pointer font-normal flex-1">
                Project Commands (<code className="text-xs">.claude/commands/</code>)
              </Label>
            </div>
          </RadioGroup>
          <p className="text-sm text-gray-500">
            User commands are personal. Project commands are shared with your team.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="namespace">Namespace (optional)</Label>
          <Input
            id="namespace"
            type="text"
            value={namespace}
            onChange={e => onNamespaceChange(e.target.value)}
            placeholder="workflows, tools, git"
          />
          <p className="text-sm text-gray-500">
            Organize commands in subdirectories (e.g., <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">workflows/feature-dev</code> →{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/workflows:feature-dev</code>)
          </p>
        </div>
      </div>

      {/* Tools Section */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Allowed Tools</h3>
        <CommandToolSelector selectedTools={allowedTools} onChange={onToolsChange} />
        <p className="text-sm text-gray-500">
          Select which Claude Code tools this command is allowed to use. The more specific, the safer.
        </p>
      </div>

      {/* Command Content */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Command Content</h3>

        <Alert>
          <AlertDescription>
            <div className="text-sm space-y-1">
              <div className="font-semibold mb-2">Syntax Guide:</div>
              <div className="space-y-1">
                <div><code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">$ARGUMENTS</code> - All arguments as one string</div>
                <div><code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">$1, $2, $3, ...</code> - Individual arguments</div>
                <div><code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">!`git status`</code> - Execute bash command</div>
                <div><code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">@src/main.ts</code> - Include file contents</div>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-2 p-3 bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-200 rounded-t-lg">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide bg-gray-200 px-2 py-1 rounded">
              Insert Variable:
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => insertAtCursor('$ARGUMENTS')}
              title="All arguments as single string"
              className="font-mono text-xs h-8"
            >
              $ARGUMENTS
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => insertAtCursor('$1')}
              title="First argument"
              className="font-mono text-xs h-8"
            >
              $1
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => insertAtCursor('$2')}
              title="Second argument"
              className="font-mono text-xs h-8"
            >
              $2
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => insertAtCursor('$3')}
              title="Third argument"
              className="font-mono text-xs h-8"
            >
              $3
            </Button>
          </div>
        </div>

        <Textarea
          id="command-content"
          value={content}
          onChange={e => onContentChange(e.target.value)}
          className="font-mono text-sm min-h-[400px] border-t-0 rounded-t-none"
          placeholder={
            'Write your command content here. Use the buttons above to insert variables.\n\nYou can use:\n- $ARGUMENTS for all arguments\n- $1, $2, $3 for individual arguments\n- !`command` for bash execution\n- @path/to/file for file references'
          }
          spellCheck={false}
        />
      </div>

      {/* Advanced Section */}
      <div className="flex flex-col gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="justify-start text-left font-medium"
        >
          {showAdvanced ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
          Advanced Options
        </Button>

        {showAdvanced && (
          <div className="space-y-4 pl-6 border-l-2 border-gray-200">
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select value={model} onValueChange={onModelChange}>
                <SelectTrigger id="model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (Current Model)</SelectItem>
                  <SelectItem value="opus">Opus (Most capable)</SelectItem>
                  <SelectItem value="sonnet">Sonnet (Balanced)</SelectItem>
                  <SelectItem value="haiku">Haiku (Fastest)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Specify which Claude model should run this command. Defaults to user&apos;s current model.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="disable-model-invocation"
                checked={disableModelInvocation}
                onCheckedChange={checked => onDisableModelInvocationChange(checked === true)}
              />
              <Label htmlFor="disable-model-invocation" className="font-normal cursor-pointer">
                Disable Model Invocation
              </Label>
            </div>
            <p className="text-sm text-gray-500 ml-6">
              If checked, Claude cannot invoke this command programmatically. Users must type it manually.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
