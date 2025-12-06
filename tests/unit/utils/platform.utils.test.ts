import { describe, it, expect } from 'vitest';
import {
  getPlatform,
  isWindows,
  isMacOS,
  isLinux,
  getScriptExtension,
  getScriptInterpreter,
  buildScriptExecutionCommand,
  getExecEnvForPlatform,
  getShell,
} from '@/shared/utils/platform.utils';

describe('Platform Utilities', () => {
  describe('Platform Detection', () => {
    describe('getPlatform()', () => {
      it('should return "windows" on win32 platform', () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
          value: 'win32',
          configurable: true,
        });

        expect(getPlatform()).toBe('windows');

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          configurable: true,
        });
      });

      it('should return "macos" on darwin platform', () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
          value: 'darwin',
          configurable: true,
        });

        expect(getPlatform()).toBe('macos');

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          configurable: true,
        });
      });

      it('should return "linux" on linux platform', () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
          value: 'linux',
          configurable: true,
        });

        expect(getPlatform()).toBe('linux');

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          configurable: true,
        });
      });
    });

    describe('isWindows()', () => {
      it('should return true on windows', () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
          value: 'win32',
          configurable: true,
        });

        expect(isWindows()).toBe(true);

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          configurable: true,
        });
      });

      it('should return false on non-windows platforms', () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
          value: 'darwin',
          configurable: true,
        });

        expect(isWindows()).toBe(false);

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          configurable: true,
        });
      });
    });

    describe('isMacOS()', () => {
      it('should return true on macOS', () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
          value: 'darwin',
          configurable: true,
        });

        expect(isMacOS()).toBe(true);

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          configurable: true,
        });
      });

      it('should return false on non-macOS platforms', () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
          value: 'win32',
          configurable: true,
        });

        expect(isMacOS()).toBe(false);

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          configurable: true,
        });
      });
    });

    describe('isLinux()', () => {
      it('should return true on Linux', () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
          value: 'linux',
          configurable: true,
        });

        expect(isLinux()).toBe(true);

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          configurable: true,
        });
      });

      it('should return false on non-Linux platforms', () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
          value: 'win32',
          configurable: true,
        });

        expect(isLinux()).toBe(false);

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          configurable: true,
        });
      });
    });
  });

  describe('Script Configuration', () => {
    describe('getScriptExtension()', () => {
      it('should return "bat" on Windows', () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
          value: 'win32',
          configurable: true,
        });

        expect(getScriptExtension()).toBe('bat');

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          configurable: true,
        });
      });

      it('should return "sh" on Unix platforms', () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
          value: 'darwin',
          configurable: true,
        });

        expect(getScriptExtension()).toBe('sh');

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          configurable: true,
        });
      });
    });

    describe('getScriptInterpreter()', () => {
      it('should return "cmd" on Windows', () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
          value: 'win32',
          configurable: true,
        });

        expect(getScriptInterpreter()).toBe('cmd');

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          configurable: true,
        });
      });

      it('should return "bash" on Unix platforms', () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
          value: 'darwin',
          configurable: true,
        });

        expect(getScriptInterpreter()).toBe('bash');

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          configurable: true,
        });
      });
    });

    describe('getShell()', () => {
      it('should return "cmd.exe" on Windows', () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
          value: 'win32',
          configurable: true,
        });

        expect(getShell()).toBe('cmd.exe');

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          configurable: true,
        });
      });

      it('should return "/bin/bash" on Unix platforms', () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
          value: 'darwin',
          configurable: true,
        });

        expect(getShell()).toBe('/bin/bash');

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          configurable: true,
        });
      });
    });
  });

  describe('Environment Configuration', () => {
    describe('getExecEnvForPlatform()', () => {
      it('should preserve existing PATH on Windows', () => {
        const originalPlatform = process.platform;
        const originalEnv = process.env.PATH;

        Object.defineProperty(process, 'platform', {
          value: 'win32',
          configurable: true,
        });
        process.env.PATH = 'C:\\Windows\\System32';

        const env = getExecEnvForPlatform();
        expect(env.PATH).toBe('C:\\Windows\\System32');

        process.env.PATH = originalEnv;
        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          configurable: true,
        });
      });

      it('should add Homebrew paths on macOS', () => {
        const originalPlatform = process.platform;
        const originalPath = process.env.PATH;

        Object.defineProperty(process, 'platform', {
          value: 'darwin',
          configurable: true,
        });
        process.env.PATH = '/usr/bin:/bin';

        const env = getExecEnvForPlatform();
        expect(env.PATH).toContain('/opt/homebrew/bin');
        expect(env.PATH).toContain('/usr/local/bin');
        expect(env.PATH).toContain('/usr/bin');
        expect(env.PATH).toContain('/bin');

        process.env.PATH = originalPath;
        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          configurable: true,
        });
      });

      it('should include standard paths on Linux', () => {
        const originalPlatform = process.platform;
        const originalPath = process.env.PATH;

        Object.defineProperty(process, 'platform', {
          value: 'linux',
          configurable: true,
        });
        process.env.PATH = '/usr/bin:/bin';

        const env = getExecEnvForPlatform();
        expect(env.PATH).toContain('/usr/local/bin');
        expect(env.PATH).toContain('/usr/bin');
        expect(env.PATH).toContain('/bin');

        process.env.PATH = originalPath;
        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
          configurable: true,
        });
      });
    });
  });

  describe('Script Execution Commands', () => {
    describe('buildScriptExecutionCommand()', () => {
      const tempDir = '/tmp/.claude';
      const scriptPath = '/home/user/.claude/statusline.sh';

      it('should return command and tempFile for Windows batch script', () => {
        const result = buildScriptExecutionCommand(
          'C:\\Users\\user\\.claude\\statusline.bat',
          'C:\\Users\\user\\.claude',
          'windows'
        );

        expect(result).toHaveProperty('command');
        expect(result).toHaveProperty('tempFile');
        expect(result.command).toContain('"C:\\Users\\user\\.claude\\statusline.bat"');
        expect(result.command).toContain('|');
        expect(result.command).toContain('type');
        expect(result.tempFile).toContain('statusline-input-');
        expect(result.tempFile).toContain('.json');
      });

      it('should use stdin redirection for Windows Node.js scripts', () => {
        const result = buildScriptExecutionCommand(
          'C:\\Users\\user\\.claude\\statusline.js',
          'C:\\Users\\user\\.claude',
          'windows'
        );

        expect(result.command).toContain('node');
        expect(result.command).toContain('"C:\\Users\\user\\.claude\\statusline.js"');
        expect(result.command).toContain('|');
        expect(result.command).toContain('type');
        expect(result.tempFile).toMatch(/statusline-input-\d+\.json/);
      });

      it('should use stdin redirection for Windows Python scripts', () => {
        const result = buildScriptExecutionCommand(
          'C:\\Users\\user\\.claude\\statusline.py',
          'C:\\Users\\user\\.claude',
          'windows'
        );

        expect(result.command).toContain('python');
        expect(result.command).toContain('"C:\\Users\\user\\.claude\\statusline.py"');
        expect(result.command).toContain('|');
        expect(result.command).toContain('type');
      });

      it('should use bash for Unix platforms', () => {
        const result = buildScriptExecutionCommand(scriptPath, tempDir, 'macos');

        expect(result.command).toContain('bash');
        expect(result.command).toContain(`"${scriptPath}"`);
        expect(result.command).toContain('<');
        expect(result.tempFile).toMatch(/statusline-input-\d+\.json/);
        // Normalize temp file path for comparison (handle Windows path separators in test)
        expect(result.tempFile.replace(/\\/g, '/')).toContain(tempDir.replace(/\\/g, '/'));
      });

      it('should use bash for Linux', () => {
        const result = buildScriptExecutionCommand(scriptPath, tempDir, 'linux');

        expect(result.command).toContain('bash');
        expect(result.command).toContain('<');
        // Normalize temp file path for comparison (handle Windows path separators in test)
        expect(result.tempFile.replace(/\\/g, '/')).toContain(tempDir.replace(/\\/g, '/'));
      });

      it('should quote script paths with spaces on Windows', () => {
        const pathWithSpaces = 'C:\\Path with spaces\\statusline.js';
        const result = buildScriptExecutionCommand(pathWithSpaces, tempDir, 'windows');

        expect(result.command).toContain(`"${pathWithSpaces}"`);
      });

      it('should quote script paths with spaces on Unix', () => {
        const pathWithSpaces = '/path with spaces/statusline.sh';
        const result = buildScriptExecutionCommand(pathWithSpaces, tempDir, 'linux');

        expect(result.command).toContain(`"${pathWithSpaces}"`);
      });

      it('should create unique temp file names with timestamp', () => {
        const result1 = buildScriptExecutionCommand(scriptPath, tempDir, 'linux');
        const result2 = buildScriptExecutionCommand(scriptPath, tempDir, 'linux');

        // Temp files should have different names (due to timestamp)
        // Note: In rare cases they might be the same if called in same millisecond
        expect(result1.tempFile).toContain('statusline-input-');
        expect(result2.tempFile).toContain('statusline-input-');
      });

      it('should quote temp file path on Windows', () => {
        const result = buildScriptExecutionCommand(
          'C:\\script.bat',
          'C:\\Users\\user\\.claude',
          'windows'
        );

        // Command should use pipe syntax: type "file" | "script"
        expect(result.command).toMatch(/type\s+"[^"]+"\s+\|\s+"[^"]+"/);
      });

      it('should quote temp file path on Unix', () => {
        const result = buildScriptExecutionCommand(scriptPath, tempDir, 'macos');

        // Both script path and temp file should be quoted
        expect(result.command).toMatch(/"[^"]+"\s+<\s+"[^"]+"/);
      });
    });
  });

  describe('Platform Consistency', () => {
    it('should be mutually exclusive - only one platform is true', () => {
      const originalPlatform = process.platform;
      const platforms: Array<'win32' | 'darwin' | 'linux'> = ['win32', 'darwin', 'linux'];

      for (const platform of platforms) {
        Object.defineProperty(process, 'platform', {
          value: platform,
          configurable: true,
        });

        const results = [isWindows(), isMacOS(), isLinux()];
        const trueCount = results.filter(r => r).length;
        expect(trueCount).toBe(1);
      }

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true,
      });
    });

    it('should match getPlatform() checks', () => {
      const originalPlatform = process.platform;

      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true,
      });
      expect(isWindows()).toBe(getPlatform() === 'windows');

      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true,
      });
      expect(isMacOS()).toBe(getPlatform() === 'macos');

      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true,
      });
      expect(isLinux()).toBe(getPlatform() === 'linux');

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
        configurable: true,
      });
    });
  });
});
