import { useState, useEffect, useCallback } from 'react';
import type {
  Skill,
  ListSkillsResponse,
  SaveSkillResponse,
  DeleteSkillResponse,
} from '@/shared/types';

export interface UseSkillsResult {
  skills: Skill[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createSkill: (
    name: string,
    description: string,
    content: string,
    location: 'user' | 'project',
    allowedTools?: string[]
  ) => Promise<boolean>;
  deleteSkill: (name: string, location: 'user' | 'project') => Promise<boolean>;
}

/**
 * React hook for managing Claude Code skills
 */
export function useSkills(): UseSkillsResult {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!window.electronAPI) {
      setError('Not running in Electron. Use npm run dev:electron to run the app.');
      setLoading(false);
      return;
    }

    try {
      const response = (await window.electronAPI.listSkills()) as ListSkillsResponse;

      if (response.success) {
        setSkills(response.data ?? []);
      } else {
        setError(response.error ?? 'Failed to fetch skills');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch skills');
    } finally {
      setLoading(false);
    }
  }, []);

  const createSkill = useCallback(
    async (
      name: string,
      description: string,
      content: string,
      location: 'user' | 'project',
      allowedTools?: string[]
    ): Promise<boolean> => {
      if (!window.electronAPI) {
        setError('Not running in Electron');
        return false;
      }

      try {
        const response = (await window.electronAPI.saveSkill({
          skill: {
            name,
            description,
            'allowed-tools': allowedTools,
            content,
            location,
          },
        })) as SaveSkillResponse;

        if (response.success) {
          // Refresh skills list
          await fetchSkills();
          return true;
        } else {
          setError(response.error ?? 'Failed to save skill');
          return false;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save skill');
        return false;
      }
    },
    [fetchSkills]
  );

  const deleteSkill = useCallback(
    async (name: string, location: 'user' | 'project'): Promise<boolean> => {
      if (!window.electronAPI) {
        setError('Not running in Electron');
        return false;
      }

      try {
        const response = (await window.electronAPI.deleteSkill({
          name,
          location,
        })) as DeleteSkillResponse;

        if (response.success) {
          // Refresh skills list
          await fetchSkills();
          return true;
        } else {
          setError(response.error ?? 'Failed to delete skill');
          return false;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete skill');
        return false;
      }
    },
    [fetchSkills]
  );

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  return {
    skills,
    loading,
    error,
    refetch: fetchSkills,
    createSkill,
    deleteSkill,
  };
}
