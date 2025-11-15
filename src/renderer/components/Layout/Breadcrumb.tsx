import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path: string;
}

export const Breadcrumb: React.FC = () => {
  const location = useLocation();

  // Build breadcrumb items from the current path
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [{ label: 'Home', path: '/' }];

    // Map path segments to readable labels
    const labelMap: Record<string, string> = {
      settings: 'Settings',
      agents: 'Subagents',
      skills: 'Skills',
      plugins: 'Plugins',
      commands: 'Slash Commands',
      hooks: 'Hooks',
      mcp: 'MCP Servers',
      sessions: 'Sessions',
      tests: 'Test Runner',
    };

    let currentPath = '';
    pathSegments.forEach(segment => {
      currentPath += `/${segment}`;
      items.push({
        label: labelMap[segment] || segment,
        path: currentPath,
      });
    });

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  // Don't show breadcrumb on home page
  if (breadcrumbItems.length === 1) {
    return null;
  }

  return (
    <nav className="text-sm" aria-label="Breadcrumb">
      <ol className="flex list-none items-center gap-2 flex-wrap">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

          return (
            <li key={item.path} className="flex items-center gap-2">
              {isLast ? (
                <span className="text-neutral-600 font-medium" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <>
                  <Link
                    to={item.path}
                    className="text-accent-400 no-underline transition-colors hover:text-accent-700 hover:underline"
                  >
                    {item.label}
                  </Link>
                  <span className="text-neutral-300">/</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
