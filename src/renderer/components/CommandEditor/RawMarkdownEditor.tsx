import { useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';
import { CommandFrontmatter } from '../../../shared/types/command.types';
import {
  parseCommandMarkdown,
  validateCommandMarkdown,
} from '../../../shared/utils/command-markdown.utils';
import { Button } from '@/renderer/components/ui/button';
import { Textarea } from '@/renderer/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/renderer/components/ui/alert';

export interface RawMarkdownEditorProps {
  markdown: string;
  onSave: (frontmatter: CommandFrontmatter, content: string) => void;
  onCancel: () => void;
}

export function RawMarkdownEditor({ markdown, onSave, onCancel }: RawMarkdownEditorProps) {
  const [editedMarkdown, setEditedMarkdown] = useState(markdown);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleSave = useCallback(() => {
    // Validate markdown
    const validation = validateCommandMarkdown(editedMarkdown);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    // Parse markdown
    const parseResult = parseCommandMarkdown(editedMarkdown);
    if (!parseResult.isValid) {
      setValidationErrors([parseResult.error || 'Failed to parse markdown']);
      return;
    }

    onSave(parseResult.frontmatter, parseResult.content);
  }, [editedMarkdown, onSave]);

  // Validation on change
  const validation = validateCommandMarkdown(editedMarkdown);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold">Edit Raw Markdown</h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Alert className="m-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Editing raw markdown. Changes won&apos;t sync back to visual form. After saving,
            you&apos;ll return to the review page.
          </AlertDescription>
        </Alert>

        <div className="flex-1 px-6 overflow-hidden">
          <Textarea
            value={editedMarkdown}
            onChange={e => {
              setEditedMarkdown(e.target.value);
              setValidationErrors([]);
            }}
            className={`h-full font-mono text-sm resize-none ${validation.valid ? '' : 'border-red-500'}`}
            spellCheck="false"
          />
        </div>

        <div className="p-6 space-y-4">
          {validation.valid && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Valid markdown</AlertTitle>
              <AlertDescription>Frontmatter is valid YAML. Ready to save.</AlertDescription>
            </Alert>
          )}

          {!validation.valid && validationErrors.length > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Validation Errors</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {!validation.valid && validation.errors.length > 0 && validationErrors.length === 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Issues</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validation.errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-4">
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!validation.valid}>
              Save Edits
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
