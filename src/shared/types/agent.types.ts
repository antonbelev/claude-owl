/**
 * Agent and skill-related type definitions
 */

import type { AgentModelAlias, CommandModelAlias } from '../constants/models';

export interface AgentFrontmatter {
  name: string;
  description: string;
  model?: AgentModelAlias;
  tools?: string[];
}

export interface Agent {
  frontmatter: AgentFrontmatter;
  content: string;
  filePath: string;
  location: 'user' | 'project' | 'plugin';
  projectPath?: string; // Required if location === 'project'
  lastModified: Date;
}

export interface SkillFrontmatter {
  name: string;
  description: string;
  'allowed-tools'?: string[];
}

export interface Skill {
  frontmatter: SkillFrontmatter;
  content: string;
  filePath: string;
  supportingFiles?: string[];
  location: 'user' | 'project' | 'plugin';
  projectPath?: string; // Required if location === 'project'
  lastModified: Date;
}

export interface CommandFrontmatter {
  description?: string;
  'argument-hint'?: string;
  'allowed-tools'?: string[];
  model?: CommandModelAlias;
  'disable-model-invocation'?: boolean;
}

export interface Command {
  name: string;
  frontmatter: CommandFrontmatter;
  content: string;
  filePath: string;
  location: 'user' | 'project' | 'plugin' | 'mcp';
  projectPath?: string; // Required if location === 'project'
  lastModified: Date;
}
