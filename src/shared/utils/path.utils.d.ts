/**
 * Path utility functions
 */
/**
 * Normalize a file path for cross-platform compatibility
 */
export declare function normalizePath(path: string): string;
/**
 * Check if a path is absolute
 */
export declare function isAbsolutePath(path: string): boolean;
/**
 * Sanitize a path to prevent path traversal attacks
 */
export declare function sanitizePath(path: string): string;
/**
 * Get file extension from path
 */
export declare function getFileExtension(path: string): string;
/**
 * Get filename without extension
 */
export declare function getFilenameWithoutExtension(path: string): string;
//# sourceMappingURL=path.utils.d.ts.map