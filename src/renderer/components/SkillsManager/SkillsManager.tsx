import React, { useState, useEffect } from 'react';
import { useSkills } from '../../hooks/useSkills';
import type { Skill } from '@/shared/types';
import { parseMarkdownWithFrontmatter, validateSkillMarkdown } from '@/shared/utils/markdown.utils';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { PageHeader } from '../common/PageHeader';
import './SkillsManager.css';

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
    // Plugin skills cannot be deleted
    if (skill.location === 'plugin') {
      return;
    }

    setDeleteConfirm(skill);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    const success = await deleteSkill(
      deleteConfirm.frontmatter.name,
      deleteConfirm.location as 'user' | 'project'
    );
    if (success) {
      setSelectedSkill(null);
    }
    setDeleteConfirm(null);
  };

  if (loading) {
    return (
      <div className="skills-manager" data-testid="skills-manager">
        <PageHeader
          title="Skills"
          description="Custom skills that extend Claude Code capabilities"
        />
        <div className="skills-loading">
          <p>Loading skills...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="skills-manager" data-testid="skills-manager">
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
        <div className="skills-error">
          <p className="error-message">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="skills-manager" data-testid="skills-manager">
      <PageHeader
        title="Skills"
        description="Custom skills that extend Claude Code capabilities"
        actions={[
          {
            label: '+ Create Skill',
            onClick: handleCreateSkill,
            variant: 'primary',
          },
        ]}
      />

      <div className="skills-content">
        {skills.length === 0 ? (
          <div className="skills-empty">
            <p>No skills found. Create your first skill to get started!</p>
            <button onClick={handleCreateSkill} className="btn-create-empty">
              Create Your First Skill
            </button>
          </div>
        ) : (
          <div className="skills-grid">
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
  const locationBadge =
    skill.location === 'user' ? 'User' : skill.location === 'project' ? 'Project' : 'Plugin';
  const locationClass = `location-badge location-${skill.location}`;

  return (
    <div className="skill-card" data-testid="skill-card" onClick={() => onView(skill)}>
      <div className="skill-card-header">
        <h3 className="skill-name">{skill.frontmatter.name}</h3>
        <span className={locationClass}>{locationBadge}</span>
      </div>
      <p className="skill-description">{skill.frontmatter.description}</p>
      {skill.supportingFiles && skill.supportingFiles.length > 0 && (
        <div className="skill-files">
          <span className="files-count">{skill.supportingFiles.length} supporting files</span>
        </div>
      )}
      {skill.frontmatter['allowed-tools'] && skill.frontmatter['allowed-tools'].length > 0 && (
        <div className="skill-tools">
          <span className="tools-label">Tools:</span>
          <span className="tools-count">
            {skill.frontmatter['allowed-tools'].length} restricted
          </span>
        </div>
      )}
    </div>
  );
};

interface SkillCreateModalProps {
  onClose: () => void;
  onCreate: (
    name: string,
    description: string,
    content: string,
    location: 'user' | 'project',
    allowedTools?: string[]
  ) => Promise<boolean>;
}

const SkillCreateModal: React.FC<SkillCreateModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState<'user' | 'project'>('user');
  const [allowedTools, setAllowedTools] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Track unsaved changes
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

    // Check file type
    if (!file.name.endsWith('.md')) {
      setError('Please upload a Markdown (.md) file');
      return;
    }

    try {
      const text = await file.text();

      // Validate the markdown structure
      const validation = validateSkillMarkdown(text);

      if (!validation.isValid) {
        setError(`Invalid skill file:\n${validation.errors.join('\n')}`);
        setValidationWarnings([]);
        return;
      }

      // Parse the file
      const parsed = parseMarkdownWithFrontmatter<{
        name?: string;
        description?: string;
        'allowed-tools'?: string[];
      }>(text);

      // Populate form with parsed data
      if (parsed.frontmatter.name) setName(parsed.frontmatter.name);
      if (parsed.frontmatter.description) setDescription(parsed.frontmatter.description);
      if (parsed.content) setContent(parsed.content);
      if (parsed.frontmatter['allowed-tools']) {
        setAllowedTools(parsed.frontmatter['allowed-tools'].join(', '));
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        setValidationWarnings(validation.warnings);
      }

      setError(null);
    } catch (err) {
      setError(`Failed to read file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Reset file input
    e.target.value = '';
  };

  const handleClose = () => {
    if (hasUnsavedChanges && !creating) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowCloseConfirm(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    const toolsArray = allowedTools.trim()
      ? allowedTools
          .split(',')
          .map(t => t.trim())
          .filter(t => t)
      : undefined;

    const success = await onCreate(name, description, content, location, toolsArray);

    if (success) {
      setHasUnsavedChanges(false); // Mark as saved before closing
      onClose();
    } else {
      setError('Failed to create skill. Please check your inputs and try again.');
    }

    setCreating(false);
  };

  return (
    <>
      <div className="modal-overlay" onClick={handleOverlayClick}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Create New Skill</h2>
            <button className="btn-close" onClick={handleClose} type="button">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="skill-form">
            {error && (
              <div className="form-error">
                {error.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            )}

            {validationWarnings.length > 0 && (
              <div className="form-warning">
                <strong>Warnings:</strong>
                {validationWarnings.map((warning, i) => (
                  <div key={i}>• {warning}</div>
                ))}
              </div>
            )}

            <div className="form-group file-upload-group">
              <label htmlFor="skill-file-upload">Upload Skill File (Optional)</label>
              <div className="file-upload-container">
                <input
                  id="skill-file-upload"
                  type="file"
                  accept=".md"
                  onChange={handleFileUpload}
                  className="file-input"
                  data-testid="skill-file-input"
                />
                <label htmlFor="skill-file-upload" className="file-upload-label">
                  📁 Choose .md file
                </label>
                <small>Upload a skill markdown file to auto-fill the form</small>
              </div>
            </div>

            <div className="form-divider">
              <span>Or create manually</span>
            </div>

            <div className="form-group">
              <label htmlFor="skill-name">
                Name <span className="required">*</span>
              </label>
              <input
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
              <small>Lowercase letters, numbers, and hyphens only (max 64 chars)</small>
            </div>

            <div className="form-group">
              <label htmlFor="skill-description">
                Description <span className="required">*</span>
              </label>
              <textarea
                id="skill-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What does this skill do? When should Claude use it?"
                maxLength={1024}
                rows={3}
                required
                data-testid="skill-description-input"
              />
              <small>Max 1024 characters. Include triggers and use cases.</small>
            </div>

            <div className="form-group">
              <label htmlFor="skill-content">
                Instructions <span className="required">*</span>
              </label>
              <textarea
                id="skill-content"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="# My Skill\n\nDetailed instructions for Claude on how to use this skill..."
                rows={10}
                required
                data-testid="skill-content-input"
              />
              <small>Markdown content with detailed instructions</small>
            </div>

            <div className="form-group">
              <label htmlFor="skill-location">
                Location <span className="required">*</span>
              </label>
              <select
                id="skill-location"
                value={location}
                onChange={e => setLocation(e.target.value as 'user' | 'project')}
                required
                data-testid="skill-location-select"
              >
                <option value="user">User (~/.claude/skills/) - Personal skills</option>
                <option value="project">Project (.claude/skills/) - Team skills</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="skill-tools">Allowed Tools (optional)</label>
              <input
                id="skill-tools"
                type="text"
                value={allowedTools}
                onChange={e => setAllowedTools(e.target.value)}
                placeholder="Read, Write, Bash"
                data-testid="skill-tools-input"
              />
              <small>Comma-separated list of allowed tools (leave empty for all tools)</small>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={creating}
                data-testid="submit-skill-btn"
              >
                {creating ? 'Creating...' : 'Create Skill'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation dialog for unsaved changes */}
      {showCloseConfirm && (
        <div className="modal-overlay confirm-overlay" onClick={handleCancelClose}>
          <div className="modal-content modal-confirm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Unsaved Changes</h2>
            </div>
            <div className="confirm-body">
              <p>You have unsaved changes. Are you sure you want to close without saving?</p>
            </div>
            <div className="modal-footer">
              <button onClick={handleCancelClose} className="btn-secondary">
                Keep Editing
              </button>
              <button onClick={handleConfirmClose} className="btn-danger">
                Discard Changes
              </button>
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
  const locationBadge =
    skill.location === 'user' ? 'User' : skill.location === 'project' ? 'Project' : 'Plugin';

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{skill.frontmatter.name}</h2>
            <span className={`location-badge location-${skill.location}`}>{locationBadge}</span>
          </div>
          <button className="btn-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="skill-detail">
          <div className="detail-section">
            <h3>Description</h3>
            <p>{skill.frontmatter.description}</p>
          </div>

          {skill.frontmatter['allowed-tools'] && skill.frontmatter['allowed-tools'].length > 0 && (
            <div className="detail-section">
              <h3>Allowed Tools</h3>
              <div className="tools-list">
                {skill.frontmatter['allowed-tools'].map(tool => (
                  <span key={tool} className="tool-badge">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="detail-section">
            <h3>Instructions</h3>
            <pre className="skill-content">{skill.content}</pre>
          </div>

          {skill.supportingFiles && skill.supportingFiles.length > 0 && (
            <div className="detail-section">
              <h3>Supporting Files</h3>
              <ul className="files-list">
                {skill.supportingFiles.map(file => (
                  <li key={file}>{file}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="detail-section">
            <h3>File Location</h3>
            <code className="file-path">{skill.filePath}</code>
          </div>

          <div className="detail-section">
            <h3>Last Modified</h3>
            <p>{new Date(skill.lastModified).toLocaleString()}</p>
          </div>
        </div>

        <div className="modal-footer">
          {skill.location !== 'plugin' && (
            <button
              onClick={() => onDelete(skill)}
              className="btn-danger"
              data-testid="delete-skill-btn"
            >
              Delete Skill
            </button>
          )}
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
