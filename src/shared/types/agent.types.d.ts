/**
 * Agent and skill-related type definitions
 */
export interface AgentFrontmatter {
    name: string;
    description: string;
    model?: 'sonnet' | 'opus' | 'haiku' | 'inherit';
    tools?: string[];
}
export interface Agent {
    frontmatter: AgentFrontmatter;
    content: string;
    filePath: string;
    location: 'user' | 'project' | 'plugin';
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
    lastModified: Date;
}
export interface CommandFrontmatter {
    description?: string;
    'argument-hint'?: string;
    'allowed-tools'?: string[];
    model?: 'sonnet' | 'opus' | 'haiku';
    'disable-model-invocation'?: boolean;
}
export interface Command {
    name: string;
    frontmatter: CommandFrontmatter;
    content: string;
    filePath: string;
    location: 'user' | 'project' | 'plugin' | 'mcp';
    lastModified: Date;
}
//# sourceMappingURL=agent.types.d.ts.map