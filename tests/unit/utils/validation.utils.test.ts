/**
 * Unit tests for validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validateScopedRequest,
  validateProjectPath,
} from '../../../src/shared/utils/validation.utils';

describe('validateScopedRequest', () => {
  it('should pass validation for user scope without projectPath', () => {
    const request = {
      scope: 'user' as const,
    };

    const result = validateScopedRequest(request);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should pass validation for user scope with location field', () => {
    const request = {
      location: 'user' as const,
    };

    const result = validateScopedRequest(request);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should fail validation for project scope without projectPath', () => {
    const request = {
      scope: 'project' as const,
    };

    const result = validateScopedRequest(request);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('projectPath is required when scope/location is "project"');
  });

  it('should fail validation for project location without projectPath', () => {
    const request = {
      location: 'project' as const,
    };

    const result = validateScopedRequest(request);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('projectPath is required when scope/location is "project"');
  });

  it('should pass validation for project scope with valid absolute path', () => {
    const request = {
      scope: 'project' as const,
      projectPath: '/home/user/my-project',
    };

    const result = validateScopedRequest(request);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should fail validation for project scope with relative path', () => {
    const request = {
      scope: 'project' as const,
      projectPath: './my-project',
    };

    const result = validateScopedRequest(request);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('projectPath must be an absolute path');
  });
});

describe('validateProjectPath', () => {
  it('should pass validation for absolute path', () => {
    const result = validateProjectPath('/home/user/my-project');

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should fail validation for relative path', () => {
    const result = validateProjectPath('./my-project');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('projectPath must be an absolute path');
  });

  it('should fail validation for relative path with ../', () => {
    const result = validateProjectPath('../my-project');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('projectPath must be an absolute path');
  });

  it('should pass validation for Windows absolute path', () => {
    const result = validateProjectPath('C:\\Users\\user\\my-project');

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
