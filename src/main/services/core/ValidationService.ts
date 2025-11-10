/**
 * ValidationService
 * Centralized service for data validation
 *
 * Provides consistent validation for common data types used throughout
 * the application. All validation logic should be centralized here.
 */

/**
 * Validation result
 */
export interface ValidationResult<T = unknown> {
  valid: boolean;
  data: T | undefined;
  errors: ValidationError[];
}

/**
 * Validation error details
 */
export interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export class ValidationService {
  /**
   * Validate JSON against a simple schema
   * For complex validation, consider using Zod or JSON Schema
   */
  validateJSON<T = unknown>(
    data: unknown,
    requiredFields?: string[],
    _expectedType?: string
  ): ValidationResult<T> {
    console.log('[ValidationService] Validating JSON:', {
      type: typeof data,
      requiredFields: requiredFields?.length,
    });

    const errors: ValidationError[] = [];

    // Check if data is an object
    if (typeof data !== 'object' || data === null) {
      errors.push({
        path: '$',
        message: `Expected object, got ${typeof data}`,
        severity: 'error',
      });
      return { valid: false, data: undefined, errors };
    }

    const obj = data as Record<string, unknown>;

    // Check required fields
    if (requiredFields) {
      for (const field of requiredFields) {
        if (!(field in obj)) {
          errors.push({
            path: field,
            message: `Missing required field: ${field}`,
            severity: 'error',
          });
        }
      }
    }

    const valid = errors.length === 0;
    console.log('[ValidationService] JSON validation result:', { valid, errorCount: errors.length });

    return {
      valid,
      data: valid ? (data as T) : undefined,
      errors,
    };
  }

  /**
   * Validate YAML frontmatter format
   * Expected format: key: value pairs
   */
  validateYAMLFrontmatter<T = Record<string, unknown>>(
    content: string,
    requiredFields?: string[]
  ): ValidationResult<T> {
    console.log('[ValidationService] Validating YAML frontmatter');

    const errors: ValidationError[] = [];
    const data: Record<string, unknown> = {};

    const lines = content.split('\n').filter((line) => line.trim());

    for (const line of lines) {
      if (!line.includes(':')) {
        errors.push({
          path: line,
          message: 'Invalid YAML format: missing colon',
          severity: 'warning',
        });
        continue;
      }

      const parts = line.split(':');
      const key = parts[0];
      if (!key) continue;
      const valueParts = parts.slice(1);
      const trimmedKey = key.trim();
      const value = valueParts.join(':').trim();

      // Simple type detection
      if (value === 'true') data[trimmedKey] = true;
      else if (value === 'false') data[trimmedKey] = false;
      else if (!isNaN(Number(value)) && value !== '') data[trimmedKey] = Number(value);
      else data[trimmedKey] = value;
    }

    // Check required fields
    if (requiredFields) {
      for (const field of requiredFields) {
        if (!(field in data)) {
          errors.push({
            path: field,
            message: `Missing required field: ${field}`,
            severity: 'error',
          });
        }
      }
    }

    const valid = errors.filter((e) => e.severity === 'error').length === 0;
    console.log('[ValidationService] YAML validation result:', { valid, errorCount: errors.length });

    return {
      valid,
      data: valid ? (data as T) : undefined,
      errors,
    };
  }

  /**
   * Validate file path safety
   * Checks for directory traversal and other suspicious patterns
   */
  validatePath(filePath: string, baseDir?: string): ValidationResult<string> {
    console.log('[ValidationService] Validating path:', { filePath, hasBaseDir: !!baseDir });

    const errors: ValidationError[] = [];

    // Check for empty path
    if (!filePath || filePath.trim() === '') {
      errors.push({
        path: 'filePath',
        message: 'Path cannot be empty',
        severity: 'error',
      });
    }

    // Check for directory traversal attempts
    if (filePath.includes('..')) {
      if (baseDir) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pathModule = require('path');
        const resolved = pathModule.resolve(filePath);
        const resolvedBase = pathModule.resolve(baseDir);
        const isChild = resolved.startsWith(resolvedBase);

        if (!isChild) {
          errors.push({
            path: 'filePath',
            message: 'Path traversal detected: path escapes base directory',
            severity: 'error',
          });
        }
      } else {
        errors.push({
          path: 'filePath',
          message: 'Path contains directory traversal (..). Please use absolute paths.',
          severity: 'warning',
        });
      }
    }

    // Check for null bytes
    if (filePath.includes('\0')) {
      errors.push({
        path: 'filePath',
        message: 'Path contains null bytes',
        severity: 'error',
      });
    }

    // Check for invalid characters on Windows
    if (process.platform === 'win32') {
      const invalidChars = /[<>:"|?*]/;
      if (invalidChars.test(filePath)) {
        errors.push({
          path: 'filePath',
          message: 'Path contains invalid Windows characters',
          severity: 'error',
        });
      }
    }

    const valid = errors.filter((e) => e.severity === 'error').length === 0;
    console.log('[ValidationService] Path validation result:', { valid });

    return {
      valid,
      data: valid ? filePath : undefined,
      errors,
    };
  }

  /**
   * Validate string is not empty
   */
  validateNonEmptyString(value: unknown, fieldName: string): ValidationResult<string> {
    const errors: ValidationError[] = [];

    if (typeof value !== 'string') {
      errors.push({
        path: fieldName,
        message: `Expected string, got ${typeof value}`,
        severity: 'error',
      });
      return { valid: false, data: undefined, errors };
    }

    if (value.trim() === '') {
      errors.push({
        path: fieldName,
        message: `${fieldName} cannot be empty`,
        severity: 'error',
      });
      return { valid: false, data: undefined, errors };
    }

    return {
      valid: true,
      data: value,
      errors,
    };
  }

  /**
   * Validate email address (basic)
   */
  validateEmail(email: unknown): ValidationResult<string> {
    const errors: ValidationError[] = [];

    if (typeof email !== 'string') {
      errors.push({
        path: 'email',
        message: `Expected string, got ${typeof email}`,
        severity: 'error',
      });
      return { valid: false, data: undefined, errors };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({
        path: 'email',
        message: 'Invalid email format',
        severity: 'error',
      });
      return { valid: false, data: undefined, errors };
    }

    return {
      valid: true,
      data: email,
      errors,
    };
  }

  /**
   * Validate URL
   */
  validateURL(url: unknown): ValidationResult<string> {
    const errors: ValidationError[] = [];

    if (typeof url !== 'string') {
      errors.push({
        path: 'url',
        message: `Expected string, got ${typeof url}`,
        severity: 'error',
      });
      return { valid: false, data: undefined, errors };
    }

    try {
      new URL(url);
    } catch {
      errors.push({
        path: 'url',
        message: 'Invalid URL format',
        severity: 'error',
      });
      return { valid: false, data: undefined, errors };
    }

    return {
      valid: true,
      data: url,
      errors,
    };
  }

  /**
   * Validate that value is one of allowed values
   */
  validateEnum<T extends string | number>(
    value: unknown,
    allowedValues: T[],
    fieldName: string
  ): ValidationResult<T> {
    const errors: ValidationError[] = [];

    if (!allowedValues.includes(value as T)) {
      errors.push({
        path: fieldName,
        message: `Invalid value. Expected one of: ${allowedValues.join(', ')}`,
        severity: 'error',
      });
      return { valid: false, data: undefined, errors };
    }

    return {
      valid: true,
      data: value as T,
      errors,
    };
  }

  /**
   * Validate array
   */
  validateArray<T = unknown>(
    value: unknown,
    minLength?: number,
    maxLength?: number
  ): ValidationResult<T[]> {
    const errors: ValidationError[] = [];

    if (!Array.isArray(value)) {
      errors.push({
        path: 'array',
        message: `Expected array, got ${typeof value}`,
        severity: 'error',
      });
      return { valid: false, data: undefined, errors };
    }

    if (minLength !== undefined && value.length < minLength) {
      errors.push({
        path: 'array',
        message: `Array length ${value.length} is less than minimum ${minLength}`,
        severity: 'error',
      });
    }

    if (maxLength !== undefined && value.length > maxLength) {
      errors.push({
        path: 'array',
        message: `Array length ${value.length} exceeds maximum ${maxLength}`,
        severity: 'error',
      });
    }

    const valid = errors.filter((e) => e.severity === 'error').length === 0;

    return {
      valid,
      data: valid ? (value as T[]) : undefined,
      errors,
    };
  }
}

// Export singleton instance
export const validationService = new ValidationService();
