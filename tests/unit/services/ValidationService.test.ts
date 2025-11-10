import { describe, it, expect } from 'vitest';
import { ValidationService } from '@/main/services/core/ValidationService';

describe('ValidationService', () => {
  const service = new ValidationService();

  describe('validateJSON', () => {
    it('should validate valid JSON object', () => {
      const data = { name: 'test', age: 30 };
      const result = service.validateJSON(data);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-object values', () => {
      const result = service.validateJSON('not an object');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].severity).toBe('error');
    });

    it('should check required fields', () => {
      const data = { name: 'test' };
      const result = service.validateJSON(data, ['name', 'email']);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          path: 'email',
          severity: 'error',
        })
      );
    });

    it('should accept valid JSON with all required fields', () => {
      const data = { name: 'test', email: 'test@test.com' };
      const result = service.validateJSON(data, ['name', 'email']);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateYAMLFrontmatter', () => {
    it('should parse valid YAML frontmatter', () => {
      const yaml = 'name: test\nversion: 1.0.0\ndraft: false';
      const result = service.validateYAMLFrontmatter(yaml);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual({
        name: 'test',
        version: '1.0.0',
        draft: false,
      });
    });

    it('should detect invalid YAML lines', () => {
      const yaml = 'invalid line without colon';
      const result = service.validateYAMLFrontmatter(yaml);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].severity).toBe('warning');
    });

    it('should validate required fields in YAML', () => {
      const yaml = 'name: test';
      const result = service.validateYAMLFrontmatter(yaml, ['name', 'version']);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          path: 'version',
          severity: 'error',
        })
      );
    });

    it('should handle type conversion', () => {
      const yaml = 'count: 42\nenabled: true\nname: test';
      const result = service.validateYAMLFrontmatter(yaml);
      expect(result.data).toEqual({
        count: 42,
        enabled: true,
        name: 'test',
      });
    });
  });

  describe('validatePath', () => {
    it('should accept valid paths', () => {
      const result = service.validatePath('/path/to/file.txt');
      expect(result.valid).toBe(true);
    });

    it('should reject empty paths', () => {
      const result = service.validatePath('');
      expect(result.valid).toBe(false);
      expect(result.errors[0].severity).toBe('error');
    });

    it('should detect null bytes', () => {
      const result = service.validatePath('/path/\0/file.txt');
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('null bytes');
    });

    it('should accept relative paths without base dir', () => {
      const result = service.validatePath('../../../etc/passwd');
      expect(result.valid).toBe(true); // Relative paths are allowed if no base dir specified
    });

    it('should prevent directory traversal with base directory', () => {
      const result = service.validatePath('../../../etc/passwd', '/home/user');
      expect(result.valid).toBe(false);
      expect(result.errors[0].severity).toBe('error');
    });

    it('should accept absolute paths within base directory', () => {
      // This test validates that paths within bounds are accepted
      const result = service.validatePath('/home/user/file.txt', '/home/user');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateNonEmptyString', () => {
    it('should accept non-empty strings', () => {
      const result = service.validateNonEmptyString('hello', 'greeting');
      expect(result.valid).toBe(true);
      expect(result.data).toBe('hello');
    });

    it('should reject non-string values', () => {
      const result = service.validateNonEmptyString(123, 'number');
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('Expected string');
    });

    it('should reject empty strings', () => {
      const result = service.validateNonEmptyString('', 'empty');
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('cannot be empty');
    });

    it('should reject whitespace-only strings', () => {
      const result = service.validateNonEmptyString('   ', 'whitespace');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      const result = service.validateEmail('user@example.com');
      expect(result.valid).toBe(true);
      expect(result.data).toBe('user@example.com');
    });

    it('should reject invalid email format', () => {
      const result = service.validateEmail('invalid-email');
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('Invalid email');
    });

    it('should reject non-string email', () => {
      const result = service.validateEmail(123);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('Expected string');
    });

    it('should reject email without domain', () => {
      const result = service.validateEmail('user@');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateURL', () => {
    it('should accept valid URLs', () => {
      const result = service.validateURL('https://example.com');
      expect(result.valid).toBe(true);
    });

    it('should accept URLs with paths', () => {
      const result = service.validateURL('https://example.com/path/to/page');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid URLs', () => {
      const result = service.validateURL('not a url');
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('Invalid URL');
    });

    it('should reject non-string URLs', () => {
      const result = service.validateURL(123);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateEnum', () => {
    it('should accept valid enum values', () => {
      const result = service.validateEnum('draft', ['draft', 'published', 'archived'], 'status');
      expect(result.valid).toBe(true);
      expect(result.data).toBe('draft');
    });

    it('should reject invalid enum values', () => {
      const result = service.validateEnum('invalid', ['draft', 'published'], 'status');
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('Expected one of');
    });

    it('should work with number enums', () => {
      const result = service.validateEnum(1, [1, 2, 3], 'level');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateArray', () => {
    it('should accept valid arrays', () => {
      const result = service.validateArray([1, 2, 3]);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual([1, 2, 3]);
    });

    it('should accept empty arrays', () => {
      const result = service.validateArray([]);
      expect(result.valid).toBe(true);
    });

    it('should reject non-array values', () => {
      const result = service.validateArray('not an array');
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('Expected array');
    });

    it('should enforce minimum length', () => {
      const result = service.validateArray([1, 2], 3);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('less than minimum');
    });

    it('should enforce maximum length', () => {
      const result = service.validateArray([1, 2, 3, 4], 2, 3);
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('exceeds maximum');
    });

    it('should accept arrays within length bounds', () => {
      const result = service.validateArray([1, 2, 3], 2, 4);
      expect(result.valid).toBe(true);
    });
  });
});
