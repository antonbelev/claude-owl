import React, { useState } from 'react';
import { useStatusLine } from '../../hooks/useStatusLine';
import type { StatusLineTemplate } from '@/shared/types/statusline.types';

export const StatusLineManager: React.FC = () => {
  const { activeConfig, templates, loading, error, setTemplate, preview, disable } =
    useStatusLine();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [previewOutput, setPreviewOutput] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  const handleTemplateSelect = async (template: StatusLineTemplate) => {
    setSelectedTemplateId(template.id);

    // Auto-preview when selecting a template
    setPreviewLoading(true);
    const result = await preview(template.id);
    setPreviewLoading(false);

    if (result && result.success) {
      setPreviewOutput(result.plainOutput || '');
    } else {
      setPreviewOutput('Preview failed');
    }
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplateId) return;

    const success = await setTemplate(selectedTemplateId);
    if (success) {
      alert('Status line template applied successfully!');
    }
  };

  const handleDisable = async () => {
    const success = await disable();
    if (success) {
      alert('Status line disabled successfully!');
      setSelectedTemplateId(null);
      setPreviewOutput('');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-gray-500">Loading status line configuration...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Status Line</h1>
        <p className="text-gray-600">
          Customize your Claude Code terminal footer with pre-built templates or custom scripts.
        </p>
      </div>

      {/* Active Configuration */}
      {activeConfig && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Active Status Line</h3>
              <p className="text-sm text-blue-700">
                {activeConfig.type === 'template'
                  ? `Template: ${activeConfig.template}`
                  : `Custom script: ${activeConfig.command}`}
              </p>
            </div>
            <button
              onClick={handleDisable}
              className="px-3 py-1 text-sm bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50"
            >
              Disable
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Templates Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Templates</h2>

          <div className="space-y-3">
            {templates.map(template => (
              <div
                key={template.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedTemplateId === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <span
                      className={`inline-block text-xs px-2 py-1 rounded mt-1 ${
                        template.category === 'beginner'
                          ? 'bg-green-100 text-green-800'
                          : template.category === 'intermediate'
                            ? 'bg-yellow-100 text-yellow-800'
                            : template.category === 'advanced'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {template.category}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-2">{template.description}</p>

                {/* Preview Text */}
                <div className="text-xs font-mono bg-gray-900 text-gray-100 p-2 rounded">
                  {template.preview}
                </div>

                {/* Dependencies */}
                {template.dependencies && template.dependencies.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Requires: {template.dependencies.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Preview Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview</h2>

          {!selectedTemplateId ? (
            <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
              Select a template to see a preview
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview Output */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2 text-sm">Live Preview</h3>
                {previewLoading ? (
                  <div className="text-sm text-gray-500">Generating preview...</div>
                ) : (
                  <div className="font-mono text-sm bg-gray-900 text-gray-100 p-3 rounded">
                    {previewOutput || 'No preview available'}
                  </div>
                )}
              </div>

              {/* Apply Button */}
              <button
                onClick={handleApplyTemplate}
                disabled={!selectedTemplateId}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                Apply Template
              </button>

              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <p className="font-semibold mb-1">What happens when you apply:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Creates a script file in ~/.claude/</li>
                  <li>Updates ~/.claude/settings.json</li>
                  <li>Status line appears in your next Claude Code session</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
        <p className="font-semibold mb-2">About Status Lines</p>
        <p>
          Status lines are terminal footers that display contextual information during Claude Code
          sessions. They show information like the current model, directory, git branch, session
          cost, and more. Choose a pre-built template or create your own custom script.
        </p>
      </div>
    </div>
  );
};
