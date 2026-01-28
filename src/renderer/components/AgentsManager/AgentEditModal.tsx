/**
 * AgentEditModal - Create and edit subagents
 *
 * Features:
 * - Unified modal using shared EditModal component
 * - Form and Raw markdown tabbed view
 * - Unsaved changes detection with confirmation
 * - Escape key handling via shared component
 *
 * @see project-docs/adr/adr-012-unified-edit-feature.md
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Code, FileText, AlertCircle } from 'lucide-react';
import { EditModal, EditModalFooter } from '@/renderer/components/common/EditModal';
import { ScopeSelector } from '@/renderer/components/common/ScopeSelector';
import { Label } from '@/renderer/components/ui/label';
import { Input } from '@/renderer/components/ui/input';
import { Textarea } from '@/renderer/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/renderer/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/renderer/components/ui/select';
import { Alert, AlertDescription } from '@/renderer/components/ui/alert';
import type { Agent, AgentFrontmatter, ProjectInfo, AgentModelAlias } from '@/shared/types';
import { AGENT_MODEL_OPTIONS } from '@/shared/types';

interface AgentEditModalProps {
  /** Agent to edit (null for create mode) */
  agent: Agent | null;
  /** Agent to copy from (for plugin agents - creates new with same content) */
  copyFrom?: Agent | null | undefined;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback to save agent */
  onSave: (agent: Omit<Agent, 'lastModified'>) => Promise<boolean>;
}

/**
 * Generate markdown content from form fields
 */
function generateMarkdown(frontmatter: AgentFrontmatter, content: string): string {
  const yamlLines: string[] = ['---'];

  yamlLines.push(`name: ${frontmatter.name}`);
  yamlLines.push(`description: ${frontmatter.description}`);

  if (frontmatter.model && frontmatter.model !== 'default') {
    yamlLines.push(`model: ${frontmatter.model}`);
  }

  if (frontmatter.tools && frontmatter.tools.length > 0) {
    yamlLines.push('tools:');
    frontmatter.tools.forEach(tool => {
      yamlLines.push(`  - ${tool}`);
    });
  }

  yamlLines.push('---');
  yamlLines.push('');
  yamlLines.push(content);

  return yamlLines.join('\n');
}

/**
 * Parse markdown content to extract frontmatter and body
 */
function parseMarkdown(markdown: string): {
  name: string;
  description: string;
  model: AgentModelAlias;
  tools: string;
  content: string;
} {
  const defaultResult = {
    name: '',
    description: '',
    model: 'default' as AgentModelAlias,
    tools: '',
    content: '',
  };

  if (!markdown.trim().startsWith('---')) {
    return { ...defaultResult, content: markdown };
  }

  const endIndex = markdown.indexOf('---', 3);
  if (endIndex === -1) {
    return { ...defaultResult, content: markdown };
  }

  const frontmatterStr = markdown.substring(3, endIndex).trim();
  const bodyContent = markdown.substring(endIndex + 3).trim();

  // Simple YAML parsing
  const lines = frontmatterStr.split('\n');
  let name = '';
  let description = '';
  let model: AgentModelAlias = 'default';
  const tools: string[] = [];
  let inToolsList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (inToolsList) {
      if (trimmed.startsWith('- ')) {
        tools.push(trimmed.substring(2).trim());
        continue;
      } else {
        inToolsList = false;
      }
    }

    if (trimmed.startsWith('name:')) {
      name = trimmed.substring(5).trim();
    } else if (trimmed.startsWith('description:')) {
      description = trimmed.substring(12).trim();
    } else if (trimmed.startsWith('model:')) {
      model = trimmed.substring(6).trim() as AgentModelAlias;
    } else if (trimmed === 'tools:') {
      inToolsList = true;
    }
  }

  return {
    name,
    description,
    model: model || 'default',
    tools: tools.join(', '),
    content: bodyContent,
  };
}

export const AgentEditModal: React.FC<AgentEditModalProps> = ({
  agent,
  copyFrom,
  onClose,
  onSave,
}) => {
  const isEditMode = agent !== null;
  const isCopyMode = copyFrom !== null && copyFrom !== undefined;

  // Source agent - either editing an existing agent or copying from another
  const sourceAgent = agent || copyFrom;

  // Form state - for copy mode, pre-fill with source agent's data but blank name
  const [name, setName] = useState(isCopyMode ? '' : sourceAgent?.frontmatter.name || '');
  const [description, setDescription] = useState(sourceAgent?.frontmatter.description || '');
  const [content, setContent] = useState(sourceAgent?.content || '');
  const [location, setLocation] = useState<'user' | 'project'>(
    isEditMode ? (agent?.location as 'user' | 'project') : 'user'
  );
  const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null);
  const [model, setModel] = useState<AgentModelAlias>(sourceAgent?.frontmatter.model || 'default');
  const [tools, setTools] = useState(sourceAgent?.frontmatter.tools?.join(', ') || '');

  // Raw markdown state
  const [rawMarkdown, setRawMarkdown] = useState('');
  const [activeTab, setActiveTab] = useState<'form' | 'raw'>('form');

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track initial values for change detection
  const initialValues = useMemo(
    () => ({
      name: isCopyMode ? '' : sourceAgent?.frontmatter.name || '',
      description: sourceAgent?.frontmatter.description || '',
      content: sourceAgent?.content || '',
      model: sourceAgent?.frontmatter.model || 'default',
      tools: sourceAgent?.frontmatter.tools?.join(', ') || '',
      location: isEditMode ? (agent?.location as 'user' | 'project') : 'user',
    }),
    [sourceAgent, isEditMode, isCopyMode, agent]
  );

  // Initialize raw markdown
  useEffect(() => {
    if (sourceAgent) {
      const frontmatter: AgentFrontmatter = {
        // For copy mode, leave name blank so user must provide a new name
        name: isCopyMode ? '' : sourceAgent.frontmatter.name,
        description: sourceAgent.frontmatter.description,
      };
      if (sourceAgent.frontmatter.model && sourceAgent.frontmatter.model !== 'default') {
        frontmatter.model = sourceAgent.frontmatter.model;
      }
      if (sourceAgent.frontmatter.tools && sourceAgent.frontmatter.tools.length > 0) {
        frontmatter.tools = sourceAgent.frontmatter.tools;
      }
      setRawMarkdown(generateMarkdown(frontmatter, sourceAgent.content));
    }
  }, [sourceAgent, isCopyMode]);

  // Calculate if there are unsaved changes
  const hasChanges = useMemo(() => {
    if (activeTab === 'raw') {
      // In raw mode, compare raw markdown with generated from initial values
      const initialFrontmatter: AgentFrontmatter = {
        name: initialValues.name,
        description: initialValues.description,
      };
      if (initialValues.model && initialValues.model !== 'default') {
        initialFrontmatter.model = initialValues.model;
      }
      if (initialValues.tools) {
        initialFrontmatter.tools = initialValues.tools
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);
      }
      const initialMarkdown = generateMarkdown(initialFrontmatter, initialValues.content);
      return rawMarkdown !== initialMarkdown;
    }

    // In form mode
    if (isEditMode) {
      return (
        name !== initialValues.name ||
        description !== initialValues.description ||
        content !== initialValues.content ||
        model !== initialValues.model ||
        tools !== initialValues.tools
      );
    }

    // In create mode, any filled field counts as changes
    return !!(name.trim() || description.trim() || content.trim());
  }, [activeTab, rawMarkdown, name, description, content, model, tools, initialValues, isEditMode]);

  // Sync form to raw when switching to raw tab
  const handleTabChange = useCallback(
    (tab: string) => {
      if (tab === 'raw' && activeTab === 'form') {
        // Generate markdown from form fields
        const frontmatter: AgentFrontmatter = {
          name: name.trim(),
          description: description.trim(),
        };
        if (model && model !== 'default') {
          frontmatter.model = model;
        }
        if (tools.trim()) {
          frontmatter.tools = tools
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);
        }
        setRawMarkdown(generateMarkdown(frontmatter, content));
      } else if (tab === 'form' && activeTab === 'raw') {
        // Parse markdown to form fields
        const parsed = parseMarkdown(rawMarkdown);
        setName(parsed.name);
        setDescription(parsed.description);
        setModel(parsed.model);
        setTools(parsed.tools);
        setContent(parsed.content);
      }
      setActiveTab(tab as 'form' | 'raw');
    },
    [activeTab, name, description, model, tools, content, rawMarkdown]
  );

  const handleSave = async () => {
    setError(null);

    // Get current values (from form or parsed from raw)
    let finalName = name;
    let finalDescription = description;
    let finalContent = content;
    let finalModel = model;
    let finalTools = tools;

    if (activeTab === 'raw') {
      const parsed = parseMarkdown(rawMarkdown);
      finalName = parsed.name;
      finalDescription = parsed.description;
      finalContent = parsed.content;
      finalModel = parsed.model;
      finalTools = parsed.tools;
    }

    // Validation
    if (!finalName.trim()) {
      setError('Agent name is required');
      return;
    }

    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(finalName)) {
      setError('Agent name must be lowercase with hyphens only (e.g., my-agent)');
      return;
    }

    if (!finalDescription.trim()) {
      setError('Description is required');
      return;
    }

    if (!finalContent.trim()) {
      setError('System prompt is required');
      return;
    }

    if (location === 'project' && !selectedProject && !isEditMode) {
      setError('Please select a project');
      return;
    }

    setSaving(true);

    const frontmatter: AgentFrontmatter = {
      name: finalName.trim(),
      description: finalDescription.trim(),
    };

    if (finalModel && finalModel !== 'default') {
      frontmatter.model = finalModel;
    }

    if (finalTools.trim()) {
      frontmatter.tools = finalTools
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
    }

    const agentData: Omit<Agent, 'lastModified'> = {
      frontmatter,
      content: finalContent.trim(),
      filePath: agent?.filePath || '',
      location,
      ...(location === 'project' && selectedProject?.path
        ? { projectPath: selectedProject.path }
        : {}),
    };

    const success = await onSave(agentData);

    setSaving(false);

    if (success) {
      onClose();
    } else {
      setError('Failed to save agent. Please try again.');
    }
  };

  // Build badge for edit mode
  const badge =
    isEditMode && agent ? { text: agent.location, variant: 'outline' as const } : undefined;

  // Determine modal title and subtitle
  const getTitle = () => {
    if (isEditMode) {
      return `Edit Subagent: ${agent?.frontmatter.name}`;
    }
    if (isCopyMode) {
      return `Copy Subagent: ${copyFrom?.frontmatter.name}`;
    }
    return 'Create New Subagent';
  };

  const getSubtitle = () => {
    if (isEditMode) {
      return undefined;
    }
    if (isCopyMode) {
      return 'Create a copy of this plugin agent in your user or project location';
    }
    return 'Create a specialized agent with custom system prompt';
  };

  const subtitle = getSubtitle();

  return (
    <EditModal
      isOpen={true}
      onClose={onClose}
      title={getTitle()}
      {...(subtitle ? { subtitle } : {})}
      {...(badge ? { badge } : {})}
      isLoading={saving}
      hasUnsavedChanges={hasChanges}
      maxWidth="max-w-3xl"
      onSave={handleSave}
      isSaveDisabled={!hasChanges && isEditMode}
      footer={
        <EditModalFooter
          onCancel={onClose}
          onSave={handleSave}
          isLoading={saving}
          isSaveDisabled={!hasChanges && isEditMode}
          saveLabel={isEditMode ? 'Save Changes' : isCopyMode ? 'Create Copy' : 'Create Subagent'}
        />
      }
    >
      <div className="p-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form/Raw Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full">
            <TabsTrigger value="form" className="flex-1 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Form
            </TabsTrigger>
            <TabsTrigger value="raw" className="flex-1 flex items-center gap-2">
              <Code className="h-4 w-4" />
              Raw Markdown
            </TabsTrigger>
          </TabsList>

          {/* Form View */}
          <TabsContent value="form" className="space-y-6 mt-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="agent-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="agent-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="my-custom-agent"
                disabled={isEditMode || saving}
                data-testid="agent-name-input"
              />
              <p className="text-xs text-muted-foreground">
                {isEditMode ? 'Name cannot be changed' : 'Lowercase with hyphens only'}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="agent-description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="agent-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What does this agent do?"
                rows={3}
                disabled={saving}
                data-testid="agent-description-input"
              />
            </div>

            {/* Scope Selector */}
            <ScopeSelector
              scope={location}
              selectedProject={selectedProject}
              onScopeChange={setLocation}
              onProjectChange={setSelectedProject}
              compact={true}
              disabled={isEditMode || saving}
              userLabel="User Subagents"
              projectLabel="Project Subagents"
              userDescription="Stored in ~/.claude/agents/"
              projectDescription="Stored in .claude/agents/"
            />

            {/* Model */}
            <div className="space-y-2">
              <Label htmlFor="agent-model">Model</Label>
              <Select
                value={model}
                onValueChange={value => setModel(value as AgentModelAlias)}
                disabled={saving}
              >
                <SelectTrigger id="agent-model" data-testid="agent-model-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[1100] max-w-md">
                  {AGENT_MODEL_OPTIONS.map(option => (
                    <SelectItem
                      key={option.alias}
                      value={option.alias}
                      className="py-2.5"
                      textValue={option.label}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Model to use for this subagent. Select &quot;Inherit&quot; to use parent context
                model.
              </p>
            </div>

            {/* Tools */}
            <div className="space-y-2">
              <Label htmlFor="agent-tools">Tools (optional)</Label>
              <Input
                id="agent-tools"
                type="text"
                value={tools}
                onChange={e => setTools(e.target.value)}
                placeholder="Read, Write, Bash (comma-separated)"
                disabled={saving}
                data-testid="agent-tools-input"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated tool names. Leave empty to allow all tools.
              </p>
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <Label htmlFor="agent-content">
                System Prompt <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="agent-content"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Enter the system prompt for this agent..."
                rows={12}
                className="font-mono text-sm"
                disabled={saving}
                data-testid="agent-content-input"
              />
              <p className="text-xs text-muted-foreground">
                The more specific and detailed your prompt, the better the agent will perform.
              </p>
            </div>
          </TabsContent>

          {/* Raw Markdown View */}
          <TabsContent value="raw" className="mt-6">
            <div className="space-y-2">
              <Label htmlFor="agent-raw-markdown">Raw Markdown</Label>
              <Textarea
                id="agent-raw-markdown"
                value={rawMarkdown}
                onChange={e => setRawMarkdown(e.target.value)}
                placeholder={`---
name: my-agent
description: A helpful agent
model: sonnet
tools:
  - Read
  - Write
---

# System Prompt

Your detailed instructions here...`}
                rows={24}
                className="font-mono text-sm"
                disabled={saving}
                data-testid="agent-raw-markdown-input"
              />
              <p className="text-xs text-muted-foreground">
                Edit the raw YAML frontmatter and markdown content directly.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </EditModal>
  );
};
