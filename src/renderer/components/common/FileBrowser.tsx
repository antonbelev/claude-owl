/**
 * Reusable File Browser Component
 * Displays directory tree and allows viewing file contents
 */

import React, { useState } from 'react';
import type { FileNode, FileContent } from '@/shared/types/ipc.filebrowser.types';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  X,
  FileText,
  Code,
} from 'lucide-react';

interface FileBrowserProps {
  nodes: FileNode[];
  onFileClick: (filePath: string) => void;
  className?: string;
}

interface FileViewerProps {
  file: FileContent | null;
  loading: boolean;
  onClose: () => void;
}

/**
 * Tree node component (recursive)
 */
const TreeNode: React.FC<{
  node: FileNode;
  level: number;
  onFileClick: (path: string) => void;
}> = ({ node, level, onFileClick }) => {
  const [expanded, setExpanded] = useState(level < 2); // Auto-expand first 2 levels

  const isDirectory = node.type === 'directory';
  const hasChildren = isDirectory && node.children && node.children.length > 0;

  const handleClick = () => {
    if (isDirectory) {
      setExpanded(!expanded);
    } else {
      onFileClick(node.path);
    }
  };

  // File extension to icon mapping
  const getFileIcon = () => {
    if (isDirectory) {
      return expanded ? <FolderOpen className="h-4 w-4 text-blue-500" /> : <Folder className="h-4 w-4 text-blue-500" />;
    }

    const ext = node.extension?.toLowerCase();
    if (ext === 'md' || ext === 'markdown') {
      return <FileText className="h-4 w-4 text-purple-500" />;
    }
    if (ext === 'ts' || ext === 'tsx' || ext === 'js' || ext === 'jsx' || ext === 'json') {
      return <Code className="h-4 w-4 text-green-500" />;
    }
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer rounded transition-colors ${
          isDirectory ? 'font-medium' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={handleClick}
      >
        {/* Expand/Collapse icon for directories with children */}
        {isDirectory && hasChildren && (
          <span className="flex-shrink-0">
            {expanded ? <ChevronDown className="h-4 w-4 text-gray-600" /> : <ChevronRight className="h-4 w-4 text-gray-600" />}
          </span>
        )}
        {isDirectory && !hasChildren && <span className="w-4" />}

        {/* File/Folder icon */}
        <span className="flex-shrink-0">{getFileIcon()}</span>

        {/* Name */}
        <span className="flex-1 text-sm truncate">{node.name}</span>

        {/* Size for files */}
        {!isDirectory && node.size !== undefined && (
          <span className="text-xs text-gray-500 flex-shrink-0">{formatSize(node.size)}</span>
        )}
      </div>

      {/* Render children if directory is expanded */}
      {isDirectory && expanded && hasChildren && (
        <div>
          {node.children!.map((child, index) => (
            <TreeNode
              key={`${child.path}-${index}`}
              node={child}
              level={level + 1}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * File content viewer component
 */
export const FileViewer: React.FC<FileViewerProps> = ({ file, loading, onClose }) => {
  if (!file && !loading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold truncate">{file?.path.split('/').pop() || 'Loading...'}</h2>
            {file && (
              <p className="text-sm text-gray-500 mt-1">
                {file.size.toLocaleString()} bytes • {file.extension.toUpperCase()} file
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading file content...</div>
            </div>
          ) : file ? (
            <pre className="text-sm font-mono bg-gray-50 p-4 rounded border overflow-x-auto whitespace-pre-wrap break-words">
              {file.content}
            </pre>
          ) : null}
        </div>
      </div>
    </div>
  );
};

/**
 * Main File Browser component
 */
export const FileBrowser: React.FC<FileBrowserProps> = ({ nodes, onFileClick, className = '' }) => {
  if (!nodes || nodes.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <div className="text-center text-gray-500">
            <Folder className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No files to display</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <h3 className="text-lg font-semibold">Plugin Files</h3>
        <p className="text-sm text-gray-500 mt-1">Browse and view plugin commands, agents, and configuration files</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t max-h-96 overflow-y-auto">
          {nodes.map((node, index) => (
            <TreeNode key={`${node.path}-${index}`} node={node} level={0} onFileClick={onFileClick} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
