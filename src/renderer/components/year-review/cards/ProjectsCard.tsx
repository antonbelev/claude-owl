import React from 'react';
import type { ReviewCardProps } from '@/shared/types';

/**
 * Projects card - Shows top projects worked on
 */
export const ProjectsCard: React.FC<ReviewCardProps> = ({ data }) => {
  const { byProject } = data;

  const topProjects = byProject.slice(0, 3);
  const otherCount = byProject.length - 3;

  const medals = ['🥇', '🥈', '🥉'];
  const titles = ['Your passion project!', 'The workhorse', 'Side hustle energy'];

  return (
    <div className="text-center text-white">
      <p className="text-white/70 text-lg mb-6">Your Top Projects</p>

      <div className="space-y-4 max-w-md mx-auto">
        {topProjects.map((project, index) => (
          <div key={project.projectPath} className="bg-white/5 rounded-lg p-4 text-left">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{medals[index]}</span>
                <div>
                  <div className="font-semibold text-white text-lg">{project.projectName}</div>
                  <div className="text-white/50 text-sm italic">&ldquo;{titles[index]}&rdquo;</div>
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-white/60">{project.sessionCount} sessions</span>
              <span className="text-emerald-400 font-medium">${project.cost.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      {otherCount > 0 && (
        <p className="mt-4 text-white/50 text-sm">
          + {otherCount} other project{otherCount !== 1 ? 's' : ''}
        </p>
      )}

      <div className="mt-6 bg-amber-500/20 rounded-lg p-4 max-w-sm mx-auto">
        <p className="text-amber-300">
          🎨 You worked on <span className="font-bold">{byProject.length}</span> different projects
          this year!
        </p>
      </div>
    </div>
  );
};
