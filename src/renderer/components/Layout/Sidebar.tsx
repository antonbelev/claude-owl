import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Settings,
  AlignLeft,
  Bot,
  Zap,
  Package,
  Terminal,
  Webhook,
  Link2,
  FileText,
  TestTube,
  FileCode,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/renderer/lib/utils';
import logoImage from '../../assets/claude-owl-logo.png';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  underDevelopment?: boolean;
}

const allNavItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/statusline', label: 'Status Line', icon: AlignLeft },
  { path: '/agents', label: 'Subagents', icon: Bot },
  { path: '/skills', label: 'Skills', icon: Zap },
  { path: '/plugins', label: 'Plugins', icon: Package, underDevelopment: true },
  { path: '/commands', label: 'Slash Commands', icon: Terminal },
  { path: '/hooks', label: 'Hooks', icon: Webhook },
  { path: '/mcp', label: 'MCP Servers', icon: Link2 },
  { path: '/sessions', label: 'Sessions', icon: FileText },
  { path: '/tests', label: 'Test Runner', icon: TestTube, underDevelopment: true },
  { path: '/logs', label: 'Debug Logs', icon: FileCode },
  { path: '/about', label: 'About', icon: Info },
];

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const [showUnderDevelopment, setShowUnderDevelopment] = React.useState(() => {
    const stored = localStorage.getItem('showUnderDevelopment');
    return stored !== null ? JSON.parse(stored) : false;
  });

  // Listen for changes from About page
  React.useEffect(() => {
    const handleDevelopmentToggle = (event: Event) => {
      const customEvent = event as CustomEvent;
      setShowUnderDevelopment(customEvent.detail.showUnderDevelopment);
    };

    window.addEventListener('showUnderDevelopmentChanged', handleDevelopmentToggle);
    return () => window.removeEventListener('showUnderDevelopmentChanged', handleDevelopmentToggle);
  }, []);

  const navItems = allNavItems.filter(item => !item.underDevelopment || showUnderDevelopment);

  return (
    <aside
      className={cn(
        'bg-sidebar-bg text-white flex flex-col flex-shrink-0 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Header with logo */}
      <div className="p-6 px-4 flex items-center gap-3 border-b border-white/10">
        <img
          src={logoImage}
          alt="Claude Owl"
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
        />
        {!isCollapsed && (
          <span className="text-lg font-semibold break-words leading-snug">Claude Owl [Beta]</span>
        )}
      </div>

      {/* Navigation items */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 text-white/70 no-underline transition-all border-l-2 border-transparent whitespace-nowrap',
                  'hover:bg-white/5 hover:text-white/90',
                  isActive && 'bg-accent-500/15 text-accent-400 border-l-accent-400'
                )
              }
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm overflow-hidden text-ellipsis">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Toggle button */}
      <button
        className="p-4 bg-white/5 border-none text-white/70 cursor-pointer transition-all border-t border-white/10 hover:bg-white/10 hover:text-white/90 flex items-center justify-center"
        onClick={onToggle}
        aria-label="Toggle sidebar"
      >
        {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </aside>
  );
};
