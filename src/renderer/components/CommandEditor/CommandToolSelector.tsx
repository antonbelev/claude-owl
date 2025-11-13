import { useState } from 'react';
import './CommandToolSelector.css';

export interface CommandToolSelectorProps {
  selectedTools: string[];
  onChange: (tools: string[]) => void;
}

// Available tools in Claude Code
const AVAILABLE_TOOLS = [
  { id: 'read', name: 'Read', description: 'Read files from disk' },
  { id: 'write', name: 'Write', description: 'Write files to disk' },
  { id: 'edit', name: 'Edit', description: 'Edit files in place' },
  { id: 'glob', name: 'Glob', description: 'Search files by pattern' },
  { id: 'grep', name: 'Grep', description: 'Search file contents' },
  { id: 'bash', name: 'Bash', description: 'Execute shell commands' },
  { id: 'webfetch', name: 'WebFetch', description: 'Fetch content from URLs' },
  { id: 'task', name: 'Task', description: 'Launch specialized agents' },
  { id: 'notebookedit', name: 'NotebookEdit', description: 'Edit Jupyter notebooks' },
];

export function CommandToolSelector({ selectedTools, onChange }: CommandToolSelectorProps) {
  const [bashInput, setBashInput] = useState('');
  const [writeInput, setWriteInput] = useState('');
  const [editInput, setEditInput] = useState('');
  const [globInput, setGlobInput] = useState('');

  const toggleTool = (toolName: string) => {
    const updated = selectedTools.includes(toolName)
      ? selectedTools.filter(t => t !== toolName)
      : [...selectedTools, toolName];
    onChange(updated);
  };

  const addToolWithFilter = (toolName: string, filter: string) => {
    if (!filter.trim()) {
      toggleTool(toolName);
      return;
    }

    const fullTool = `${toolName}(${filter})`;
    const updated = selectedTools.includes(fullTool)
      ? selectedTools.filter(t => t !== fullTool)
      : [...selectedTools, fullTool];
    onChange(updated);
  };

  const handleBashAdd = () => {
    if (bashInput.trim()) {
      addToolWithFilter('Bash', bashInput);
      setBashInput('');
    }
  };

  const handleWriteAdd = () => {
    if (writeInput.trim()) {
      addToolWithFilter('Write', writeInput);
      setWriteInput('');
    }
  };

  const handleEditAdd = () => {
    if (editInput.trim()) {
      addToolWithFilter('Edit', editInput);
      setEditInput('');
    }
  };

  const handleGlobAdd = () => {
    if (globInput.trim()) {
      addToolWithFilter('Glob', globInput);
      setGlobInput('');
    }
  };

  const removeTool = (tool: string) => {
    onChange(selectedTools.filter(t => t !== tool));
  };

  return (
    <div className="tool-selector">
      <div className="tool-buttons">
        {AVAILABLE_TOOLS.map(tool => {
          const isSelected = selectedTools.some(
            t => t === tool.name || t.startsWith(`${tool.name}(`)
          );

          return (
            <button
              key={tool.id}
              className={`tool-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleTool(tool.name)}
              title={tool.description}
            >
              🔧 {tool.name}
            </button>
          );
        })}
      </div>

      {/* Tools with filters */}
      <div className="tools-with-filters">
        {selectedTools.includes('Bash') && (
          <div className="tool-filter-group">
            <label>Bash Commands</label>
            <div className="filter-input-group">
              <input
                type="text"
                value={bashInput}
                onChange={e => setBashInput(e.target.value)}
                placeholder="e.g., git add:*, npm run test:*"
                onKeyPress={e => e.key === 'Enter' && handleBashAdd()}
              />
              <button onClick={handleBashAdd} className="add-filter-btn">
                Add
              </button>
            </div>
            <div className="filter-hint">
              Specify which bash commands are allowed (e.g., git:*, npm run:*)
            </div>
            {selectedTools
              .filter(t => t.startsWith('Bash('))
              .map(tool => (
                <div key={tool} className="selected-tool-badge">
                  <span>{tool}</span>
                  <button
                    className="remove-btn"
                    onClick={() => removeTool(tool)}
                    title="Remove tool"
                  >
                    ×
                  </button>
                </div>
              ))}
          </div>
        )}

        {selectedTools.includes('Write') && (
          <div className="tool-filter-group">
            <label>Write Paths</label>
            <div className="filter-input-group">
              <input
                type="text"
                value={writeInput}
                onChange={e => setWriteInput(e.target.value)}
                placeholder="e.g., src/**, docs/**, *.md"
                onKeyPress={e => e.key === 'Enter' && handleWriteAdd()}
              />
              <button onClick={handleWriteAdd} className="add-filter-btn">
                Add
              </button>
            </div>
            <div className="filter-hint">
              Specify which files can be written (use globbing patterns)
            </div>
            {selectedTools
              .filter(t => t.startsWith('Write('))
              .map(tool => (
                <div key={tool} className="selected-tool-badge">
                  <span>{tool}</span>
                  <button
                    className="remove-btn"
                    onClick={() => removeTool(tool)}
                    title="Remove tool"
                  >
                    ×
                  </button>
                </div>
              ))}
          </div>
        )}

        {selectedTools.includes('Edit') && (
          <div className="tool-filter-group">
            <label>Edit Paths</label>
            <div className="filter-input-group">
              <input
                type="text"
                value={editInput}
                onChange={e => setEditInput(e.target.value)}
                placeholder="e.g., src/**, *.ts, *.tsx"
                onKeyPress={e => e.key === 'Enter' && handleEditAdd()}
              />
              <button onClick={handleEditAdd} className="add-filter-btn">
                Add
              </button>
            </div>
            <div className="filter-hint">
              Specify which files can be edited (use globbing patterns)
            </div>
            {selectedTools
              .filter(t => t.startsWith('Edit('))
              .map(tool => (
                <div key={tool} className="selected-tool-badge">
                  <span>{tool}</span>
                  <button
                    className="remove-btn"
                    onClick={() => removeTool(tool)}
                    title="Remove tool"
                  >
                    ×
                  </button>
                </div>
              ))}
          </div>
        )}

        {selectedTools.includes('Glob') && (
          <div className="tool-filter-group">
            <label>Glob Patterns</label>
            <div className="filter-input-group">
              <input
                type="text"
                value={globInput}
                onChange={e => setGlobInput(e.target.value)}
                placeholder="e.g., src/**, *.ts"
                onKeyPress={e => e.key === 'Enter' && handleGlobAdd()}
              />
              <button onClick={handleGlobAdd} className="add-filter-btn">
                Add
              </button>
            </div>
            <div className="filter-hint">Specify which files can be globbed</div>
            {selectedTools
              .filter(t => t.startsWith('Glob('))
              .map(tool => (
                <div key={tool} className="selected-tool-badge">
                  <span>{tool}</span>
                  <button
                    className="remove-btn"
                    onClick={() => removeTool(tool)}
                    title="Remove tool"
                  >
                    ×
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {selectedTools.length > 0 && (
        <div className="tools-summary">
          <h4>Selected Tools</h4>
          <div className="tools-list">
            {selectedTools.map(tool => (
              <div key={tool} className="tool-item">
                <code>{tool}</code>
                <button className="remove-btn" onClick={() => removeTool(tool)} title="Remove tool">
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTools.some(t => t.includes('(*)')) && (
        <div className="wildcard-warning">
          ⚠️ <strong>Warning:</strong> You have wildcard permissions (e.g., <code>Bash(*)</code>).
          This allows any command/file. Consider being more specific for security.
        </div>
      )}
    </div>
  );
}
