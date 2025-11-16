import React, { useState, useEffect } from 'react';
import { useSkills } from '../../hooks/useSkills';
import type { Skill, ProjectInfo } from '@/shared/types';
import { parseMarkdownWithFrontmatter, validateSkillMarkdown } from '@/shared/utils/markdown.utils';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PageHeader } from '../common/PageHeader';
import { ScopeSelector } from '../common/ScopeSelector';
import { Card, CardContent, CardHeader } from '@/renderer/components/ui/card';
import { Button } from '@/renderer/components/ui/button';
import { Badge } from '@/renderer/components/ui/badge';
import { Input } from '@/renderer/components/ui/input';
import { Textarea } from '@/renderer/components/ui/textarea';
import { Label } from '@/renderer/components/ui/label';
import { Alert, AlertDescription } from '@/renderer/components/ui/alert';
import {
  FileCode,
  Wrench,
  Folder,
  Upload,
  X,
  AlertCircle,
  Trash2,
  Clock,
  Plus,
} from 'lucide-react';

export const SkillsManager: React.FC = () => {
  const { skills, loading, error, refetch, createSkill, deleteSkill } = useSkills();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Skill | null>(null);

  const handleCreateSkill = () => {
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
  };

  const handleViewSkill = (skill: Skill) => {
    setSelectedSkill(skill);
  };

  const handleCloseDetail = () => {
    setSelectedSkill(null);
  };

  const handleDeleteSkill = (skill: Skill) => {
    if (skill.location === 'plugin') {
      return;
    }
    setDeleteConfirm(skill);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    const success = await deleteSkill(
      deleteConfirm.frontmatter.name,
      deleteConfirm.location as 'user' | 'project',
      deleteConfirm.projectPath
    );
    if (success) {
      setSelectedSkill(null);
    }
    setDeleteConfirm(null);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-white p-8" data-testid="skills-manager">
        <PageHeader
          title="Skills"
          description="Custom skills that extend Claude Code capabilities"
        />
        <div className="text-center py-16">
          <p className="text-neutral-500">Loading skills...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col bg-white p-8" data-testid="skills-manager">
        <PageHeader
          title="Skills"
          description="Custom skills that extend Claude Code capabilities"
          actions={[
            {
              label: 'Retry',
              onClick: refetch,
              variant: 'secondary',
            },
          ]}
        />
        <div className="text-center py-16">
          <Alert variant="destructive">
            <AlertDescription>Error: {error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white p-8" data-testid="skills-manager">
      <PageHeader
        title="Skills"
        description="Custom skills that extend Claude Code capabilities"
        actions={[
          {
            label: 'Create Skill',
            onClick: handleCreateSkill,
            variant: 'default',
            icon: Plus,
          },
        ]}
      />

      <div className="flex-1 mt-8">
        {skills.length === 0 ? (
          <div className="text-center py-16">
            <FileCode className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Skills Yet</h3>
            <p className="text-neutral-600 mb-6">
              Create your first skill to extend Claude Code&apos;s capabilities!
            </p>
            <Button onClick={handleCreateSkill} size="lg">
              Create Your First Skill
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map(skill => (
              <SkillCard
                key={`${skill.location}-${skill.frontmatter.name}`}
                skill={skill}
                onView={handleViewSkill}
                onDelete={handleDeleteSkill}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && <SkillCreateModal onClose={handleCloseModal} onCreate={createSkill} />}

      {selectedSkill && (
        <SkillDetailModal
          skill={selectedSkill}
          onClose={handleCloseDetail}
          onDelete={handleDeleteSkill}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Skill"
          message={`Are you sure you want to delete the skill "${deleteConfirm.frontmatter.name}"?`}
          confirmText="Delete"
          cancelText="Cancel"
          isDangerous={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

interface SkillCardProps {
  skill: Skill;
  onView: (skill: Skill) => void;
  onDelete: (skill: Skill) => void;
}

const SkillCard: React.FC<SkillCardProps> = ({ skill, onView }) => {
  const locationVariant =
    skill.location === 'user' ? 'default' : skill.location === 'project' ? 'secondary' : 'outline';

  return (
    <Card
      className="cursor-pointer transition-all hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5"
      data-testid="skill-card"
      onClick={() => onView(skill)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold text-neutral-900 flex-1 break-words">
            {skill.frontmatter.name}
          </h3>
          <Badge variant={locationVariant} className="ml-2 shrink-0">
            {skill.location.charAt(0).toUpperCase() + skill.location.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-neutral-600 line-clamp-2">{skill.frontmatter.description}</p>

        <div className="flex flex-wrap gap-3 text-sm">
          {skill.supportingFiles && skill.supportingFiles.length > 0 && (
            <div className="flex items-center gap-1 text-neutral-600">
              <Folder className="h-4 w-4" />
              <span>{skill.supportingFiles.length} files</span>
            </div>
          )}
          {skill.frontmatter['allowed-tools'] && skill.frontmatter['allowed-tools'].length > 0 && (
            <div className="flex items-center gap-1 text-neutral-600">
              <Wrench className="h-4 w-4" />
              <span>{skill.frontmatter['allowed-tools'].length} tools</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface SkillCreateModalProps {
  onClose: () => void;
  onCreate: (
    name: string,
    description: string,
    content: string,
    location: 'user' | 'project',
    allowedTools?: string[],
    projectPath?: string
  ) => Promise<boolean>;
}

const SkillCreateModal: React.FC<SkillCreateModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState<'user' | 'project'>('user');
  const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null);
  const [allowedTools, setAllowedTools] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  useEffect(() => {
    const hasContent = !!(
      name.trim() ||
      description.trim() ||
      content.trim() ||
      allowedTools.trim()
    );
    setHasUnsavedChanges(hasContent);
  }, [name, description, content, allowedTools]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.md')) {
      setError('Please upload a Markdown (.md) file');
      return;
    }

    try {
      const text = await file.text();
      const validation = validateSkillMarkdown(text);

      if (!validation.isValid) {
        setError(`Invalid skill file:\n${validation.errors.join('\n')}`);
        setValidationWarnings([]);
        return;
      }

      const parsed = parseMarkdownWithFrontmatter<{
        name?: string;
        description?: string;
        'allowed-tools'?: string[];
      }>(text);

      if (parsed.frontmatter.name) setName(parsed.frontmatter.name);
      if (parsed.frontmatter.description) setDescription(parsed.frontmatter.description);
      if (parsed.content) setContent(parsed.content);
      if (parsed.frontmatter['allowed-tools']) {
        setAllowedTools(parsed.frontmatter['allowed-tools'].join(', '));
      }

      if (validation.warnings.length > 0) {
        setValidationWarnings(validation.warnings);
      }

      setError(null);
    } catch (err) {
      setError(`Failed to read file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    e.target.value = '';
  };

  const handleClose = () => {
    if (hasUnsavedChanges && !creating) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate project selection when location is 'project'
    if (location === 'project' && !selectedProject) {
      setError('Please select a project');
      return;
    }

    setCreating(true);
    setError(null);

    const toolsArray = allowedTools.trim()
      ? allowedTools
          .split(',')
          .map(t => t.trim())
          .filter(t => t)
      : undefined;

    const projectPath = location === 'project' ? selectedProject?.path : undefined;
    const success = await onCreate(name, description, content, location, toolsArray, projectPath);

    if (success) {
      setHasUnsavedChanges(false);
      onClose();
    } else {
      setError('Failed to create skill. Please check your inputs and try again.');
    }

    setCreating(false);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
        onClick={handleOverlayClick}
      >
        <div
          className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-semibold">Create New Skill</h2>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error.split('\n').map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            {validationWarnings.length > 0 && (
              <Alert variant="default" className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900">
                  <strong>Warnings:</strong>
                  {validationWarnings.map((warning, i) => (
                    <div key={i}>• {warning}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="skill-file-upload">Upload Skill File (Optional)</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="skill-file-upload"
                  type="file"
                  accept=".md"
                  onChange={handleFileUpload}
                  className="flex-1"
                  data-testid="skill-file-input"
                />
                <Upload className="h-4 w-4 text-neutral-400" />
              </div>
              <p className="text-sm text-neutral-600">
                Upload a skill markdown file to auto-fill the form
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-neutral-500">Or create manually</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="skill-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="my-awesome-skill"
                pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
                maxLength={64}
                required
                data-testid="skill-name-input"
              />
              <p className="text-sm text-neutral-600">
                Lowercase letters, numbers, and hyphens only (max 64 chars)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill-description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="skill-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What does this skill do? When should Claude use it?"
                maxLength={1024}
                rows={3}
                required
                data-testid="skill-description-input"
              />
              <p className="text-sm text-neutral-600">
                Max 1024 characters. Include triggers and use cases.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill-content">
                Instructions <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="skill-content"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="# My Skill&#10;&#10;Detailed instructions for Claude on how to use this skill..."
                rows={10}
                required
                data-testid="skill-content-input"
              />
              <p className="text-sm text-neutral-600">
                Markdown content with detailed instructions
              </p>
            </div>

            <ScopeSelector
              scope={location}
              selectedProject={selectedProject}
              onScopeChange={setLocation}
              onProjectChange={setSelectedProject}
              compact={true}
              userLabel="User Skills"
              projectLabel="Project Skills"
              userDescription="Personal skills in ~/.claude/skills/"
              projectDescription="Team skills in .claude/skills/"
            />

            <div className="space-y-2">
              <Label htmlFor="skill-tools">Allowed Tools (optional)</Label>
              <Input
                id="skill-tools"
                type="text"
                value={allowedTools}
                onChange={e => setAllowedTools(e.target.value)}
                placeholder="Read, Write, Bash"
                data-testid="skill-tools-input"
              />
              <p className="text-sm text-neutral-600">
                Comma-separated list of allowed tools (leave empty for all tools)
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" onClick={handleClose} variant="secondary" disabled={creating}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating} data-testid="submit-skill-btn">
                {creating ? 'Creating...' : 'Create Skill'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {showCloseConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
          onClick={() => setShowCloseConfirm(false)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-md shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Unsaved Changes</h2>
            </div>
            <div className="p-6">
              <p className="text-neutral-600">
                You have unsaved changes. Are you sure you want to close without saving?
              </p>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <Button onClick={() => setShowCloseConfirm(false)} variant="secondary">
                Keep Editing
              </Button>
              <Button
                onClick={() => {
                  setShowCloseConfirm(false);
                  onClose();
                }}
                variant="destructive"
              >
                Discard Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface SkillDetailModalProps {
  skill: Skill;
  onClose: () => void;
  onDelete: (skill: Skill) => void;
}

const SkillDetailModal: React.FC<SkillDetailModalProps> = ({ skill, onClose, onDelete }) => {
  const locationVariant =
    skill.location === 'user' ? 'default' : skill.location === 'project' ? 'secondary' : 'outline';

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">{skill.frontmatter.name}</h2>
            <Badge variant={locationVariant}>
              {skill.location.charAt(0).toUpperCase() + skill.location.slice(1)}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-3">Description</h3>
            <p className="text-neutral-600">{skill.frontmatter.description}</p>
          </div>

          {skill.frontmatter['allowed-tools'] && skill.frontmatter['allowed-tools'].length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Allowed Tools</h3>
              <div className="flex flex-wrap gap-2">
                {skill.frontmatter['allowed-tools'].map(tool => (
                  <Badge key={tool} variant="secondary">
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-3">Instructions</h3>
            <pre className="bg-neutral-50 p-4 rounded-md overflow-x-auto font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">
              {skill.content}
            </pre>
          </div>

          {skill.supportingFiles && skill.supportingFiles.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Supporting Files</h3>
              <ul className="list-disc list-inside space-y-1 text-neutral-600">
                {skill.supportingFiles.map(file => (
                  <li key={file} className="font-mono text-sm">
                    {file}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4 text-sm">
            <div>
              <span className="font-semibold text-neutral-700">File Location:</span>
              <code className="block bg-neutral-50 p-2 rounded font-mono text-xs mt-1 overflow-x-auto">
                {skill.filePath}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-neutral-500" />
              <span className="font-semibold text-neutral-700">Last Modified:</span>
              <span className="text-neutral-600">
                {new Date(skill.lastModified).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-between p-6 border-t gap-3">
          {skill.location !== 'plugin' && (
            <Button
              onClick={() => onDelete(skill)}
              variant="destructive"
              data-testid="delete-skill-btn"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Skill
            </Button>
          )}
          <Button
            onClick={onClose}
            variant="secondary"
            className={skill.location === 'plugin' ? 'ml-auto' : ''}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
