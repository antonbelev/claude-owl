import React, { useState } from 'react';
import { useStatusLine } from '../../hooks/useStatusLine';
import { useSettings } from '../../hooks/useSettings';
import type { StatusLineTemplate } from '@/shared/types/statusline.types';

export const StatusLineManager: React.FC = () => {
  const { activeConfig, templates, loading, error, setTemplate, preview, disable } =
    useStatusLine();
  const { effectiveConfig } = useSettings();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [previewOutput, setPreviewOutput] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [appliedScriptInfo, setAppliedScriptInfo] = useState<{
    path: string;
    content: string;
  } | null>(null);

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

    const result = await setTemplate(selectedTemplateId);
    if (result) {
      setAppliedScriptInfo(result);
      setShowSuccessModal(true);
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

  const handleOpenLink = (url: string) => {
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
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

      {/* Warning Banner - Hooks Disabled */}
      {effectiveConfig?.merged.disableAllHooks && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-400 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1 text-lg">
                Status Lines Won&apos;t Work - Hooks Are Disabled
              </h3>
              <p className="text-red-800 mb-3">
                Your settings have <strong>&quot;disableAllHooks&quot;</strong> enabled. This
                prevents status lines from displaying because they rely on hooks to show session
                information.
              </p>
              <p className="text-red-800">
                To enable status lines: Go to{' '}
                <strong>Settings → User Settings → Core Config → MCP Server Management</strong> and
                uncheck &quot;Disable all hooks&quot;.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Configuration */}
      {activeConfig && activeConfig.command && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Active Status Line</h3>
              <p className="text-sm text-blue-700">
                {activeConfig.type === 'text'
                  ? `Text: ${activeConfig.text}`
                  : `Script: ${activeConfig.command}`}
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
              {/* Live Preview Output */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2 text-sm">Live Preview</h3>
                {previewLoading ? (
                  <div className="text-sm text-gray-500">Generating preview...</div>
                ) : (
                  <div className="font-mono text-sm bg-gray-900 text-gray-100 p-3 rounded">
                    {previewOutput || 'No preview available'}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  This is how your status line will appear in the terminal
                </p>
              </div>

              {/* Script Code */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2 text-sm">Script Code</h3>
                <div className="bg-gray-900 text-gray-100 rounded p-3 overflow-x-auto max-h-64 overflow-y-auto">
                  <pre className="text-xs font-mono whitespace-pre">
                    {templates.find(t => t.id === selectedTemplateId)?.script || ''}
                  </pre>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This script will be created at ~/.claude/statusline-{selectedTemplateId}.sh with
                  executable permissions
                </p>
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

      {/* Community Projects */}
      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
        <div className="flex items-start gap-2 mb-2">
          <svg
            className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p className="font-semibold text-amber-900 mb-1">Community Projects</p>
            <p className="text-amber-800 mb-3">
              The following open-source projects provide additional statusline implementations. Use
              at your own discretion - review the code before installing:
            </p>
            <ul className="space-y-2 text-amber-800">
              <li>
                <button
                  onClick={() => handleOpenLink('https://github.com/sirmalloc/ccstatusline')}
                  className="underline hover:text-amber-900 font-mono text-xs cursor-pointer bg-transparent border-none p-0"
                >
                  github.com/sirmalloc/ccstatusline
                </button>
              </li>
              <li>
                <button
                  onClick={() =>
                    handleOpenLink('https://github.com/rz1989s/claude-code-statusline')
                  }
                  className="underline hover:text-amber-900 font-mono text-xs cursor-pointer bg-transparent border-none p-0"
                >
                  github.com/rz1989s/claude-code-statusline
                </button>
              </li>
            </ul>
            <p className="text-xs text-amber-700 mt-3">
              ⚠️ Always review third-party scripts before executing them on your system.
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && appliedScriptInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Status Line Applied!</h2>
                <p className="text-sm text-gray-600 mt-1">Your status line has been configured</p>
              </div>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Script Location */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Script Location</h3>
                <div className="bg-gray-50 border border-gray-200 rounded p-3 font-mono text-sm break-all">
                  {appliedScriptInfo.path}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  The script has been created with executable permissions (chmod +x)
                </p>
              </div>

              {/* Script Content */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Script Content</h3>
                <div className="bg-gray-900 text-gray-100 rounded p-4 overflow-x-auto">
                  <pre className="text-xs font-mono whitespace-pre">
                    {appliedScriptInfo.content}
                  </pre>
                </div>
              </div>

              {/* Next Steps */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Next Steps</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Start a new Claude Code session to see your status line</li>
                  <li>
                    Run: <code className="bg-blue-100 px-1 rounded">claude</code>
                  </li>
                  <li>The status line will appear at the bottom of your terminal</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
