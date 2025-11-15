import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectDiscoveryService } from '@/main/services/ProjectDiscoveryService';
import path from 'path';
import { homedir } from 'os';

describe('ProjectDiscoveryService', () => {
  let projectDiscoveryService: ProjectDiscoveryService;

  beforeEach(() => {
    projectDiscoveryService = new ProjectDiscoveryService();
  });

  describe('getClaudeConfigPath', () => {
    it('should return path to .claude.json in home directory', () => {
      const result = projectDiscoveryService.getClaudeConfigPath();
      expect(result).toBe(path.join(homedir(), '.claude.json'));
    });
  });

  describe('parseProjectInfo', () => {
    it('should extract project name from path', () => {
      const projectPath = '/home/user/my-awesome-project';
      const projectData = {
        mcpServers: {},
        hasTrustDialogAccepted: true,
      };

      const result = (projectDiscoveryService as any).parseProjectInfo(projectPath, projectData);

      expect(result.name).toBe('my-awesome-project');
      expect(result.path).toBe(projectPath);
    });

    it('should count MCP servers correctly', () => {
      const projectPath = '/home/user/project';
      const projectData = {
        mcpServers: {
          'server1': { type: 'stdio', command: 'node', args: [] },
          'server2': { type: 'stdio', command: 'python', args: [] },
        },
        hasTrustDialogAccepted: false,
      };

      const result = (projectDiscoveryService as any).parseProjectInfo(projectPath, projectData);

      expect(result.mcpServerCount).toBe(2);
      expect(result.mcpServerNames).toEqual(['server1', 'server2']);
    });

    it('should handle missing MCP servers', () => {
      const projectPath = '/home/user/project';
      const projectData = {
        hasTrustDialogAccepted: true,
      };

      const result = (projectDiscoveryService as any).parseProjectInfo(projectPath, projectData);

      expect(result.mcpServerCount).toBe(0);
      expect(result.mcpServerNames).toEqual([]);
    });

    it('should extract trust acceptance status', () => {
      const projectPath = '/home/user/project';
      const projectData1 = { hasTrustDialogAccepted: true };
      const projectData2 = { hasTrustDialogAccepted: false };
      const projectData3 = {};

      const result1 = (projectDiscoveryService as any).parseProjectInfo(projectPath, projectData1);
      const result2 = (projectDiscoveryService as any).parseProjectInfo(projectPath, projectData2);
      const result3 = (projectDiscoveryService as any).parseProjectInfo(projectPath, projectData3);

      expect(result1.hasTrustAccepted).toBe(true);
      expect(result2.hasTrustAccepted).toBe(false);
      expect(result3.hasTrustAccepted).toBe(false);
    });
  });

  describe('checkClaudeConfig', () => {
    it('should return correct structure with exists, path, readable, and projectCount', async () => {
      // Mock fs.access to simulate file doesn't exist
      const result = await projectDiscoveryService.checkClaudeConfig();

      expect(result).toHaveProperty('exists');
      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('readable');
      expect(result).toHaveProperty('projectCount');
      expect(typeof result.exists).toBe('boolean');
      expect(typeof result.path).toBe('string');
      expect(typeof result.readable).toBe('boolean');
      expect(typeof result.projectCount).toBe('number');
    });
  });
});
