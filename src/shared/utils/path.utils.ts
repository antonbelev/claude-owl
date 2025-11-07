/**
 * Path utility functions
 */

/**
 * Normalize a file path for cross-platform compatibility
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

/**
 * Check if a path is absolute
 */
export function isAbsolutePath(path: string): boolean {
  // Unix absolute path starts with /
  if (path.startsWith('/')) return true;
  // Windows absolute path like C:\ or \\
  if (/^[a-zA-Z]:\\/.test(path)) return true;
  if (path.startsWith('\\\\')) return true;
  return false;
}

/**
 * Sanitize a path to prevent path traversal attacks
 */
export function sanitizePath(path: string): string {
  // Remove any ../ or ..\ patterns
  const normalized = normalizePath(path);
  const parts = normalized.split('/').filter(part => part !== '..' && part !== '.');
  return parts.join('/');
}

/**
 * Get file extension from path
 */
export function getFileExtension(path: string): string {
  const match = path.match(/\.([^.]+)$/);
  return match?.[1] ?? '';
}

/**
 * Get filename without extension
 */
export function getFilenameWithoutExtension(path: string): string {
  const normalized = normalizePath(path);
  const filename = normalized.split('/').pop();
  if (!filename) return '';
  return filename.replace(/\.[^.]+$/, '');
}
