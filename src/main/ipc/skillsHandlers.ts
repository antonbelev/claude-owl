import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@/shared/types';
import type {
  ListSkillsResponse,
  GetSkillRequest,
  GetSkillResponse,
  SaveSkillRequest,
  SaveSkillResponse,
  DeleteSkillRequest,
  DeleteSkillResponse,
} from '@/shared/types';
import { SkillsService } from '../services/SkillsService';

const skillsService = new SkillsService();

/**
 * Register IPC handlers for skills operations
 */
export function registerSkillsHandlers() {
  // List all skills
  ipcMain.handle(IPC_CHANNELS.LIST_SKILLS, async (): Promise<ListSkillsResponse> => {
    try {
      const skills = await skillsService.listAllSkills();
      return {
        success: true,
        data: skills,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list skills',
      };
    }
  });

  // Get a specific skill
  ipcMain.handle(
    IPC_CHANNELS.GET_SKILL,
    async (_event, request: GetSkillRequest): Promise<GetSkillResponse> => {
      try {
        const skill = await skillsService.getSkill(
          request.name,
          request.location,
          request.projectPath
        );
        return {
          success: true,
          data: skill,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get skill',
        };
      }
    }
  );

  // Save a skill (create or update)
  ipcMain.handle(
    IPC_CHANNELS.SAVE_SKILL,
    async (_event, request: SaveSkillRequest): Promise<SaveSkillResponse> => {
      console.log('[SkillsHandlers] Save skill request:', {
        name: request.skill.name,
        location: request.skill.location,
        projectPath: request.skill.projectPath,
      });

      try {
        const skill = await skillsService.saveSkill(
          request.skill.name,
          request.skill.description,
          request.skill.content,
          request.skill.location,
          request.skill['allowed-tools'],
          request.skill.projectPath
        );

        console.log('[SkillsHandlers] Skill saved successfully:', {
          name: request.skill.name,
          location: request.skill.location,
        });

        return {
          success: true,
          data: skill,
        };
      } catch (error) {
        console.error('[SkillsHandlers] Save skill error:', {
          name: request.skill.name,
          error: error instanceof Error ? error.message : String(error),
        });

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to save skill',
        };
      }
    }
  );

  // Delete a skill
  ipcMain.handle(
    IPC_CHANNELS.DELETE_SKILL,
    async (_event, request: DeleteSkillRequest): Promise<DeleteSkillResponse> => {
      try {
        await skillsService.deleteSkill(request.name, request.location, request.projectPath);
        return {
          success: true,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to delete skill',
        };
      }
    }
  );
}
