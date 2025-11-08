import React from 'react';
import { NavLink } from 'react-router-dom';
import logoImage from '../../assets/claude-owl-logo.png';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
  { path: '/agents', label: 'Subagents', icon: '🤖' },
  { path: '/skills', label: 'Skills', icon: '⚡' },
  { path: '/plugins', label: 'Plugins', icon: '🔌' },
  { path: '/commands', label: 'Commands', icon: '⌘' },
  { path: '/hooks', label: 'Hooks', icon: '🪝' },
  { path: '/mcp', label: 'MCP Servers', icon: '🔗' },
  { path: '/sessions', label: 'Sessions', icon: '📝' },
  { path: '/tests', label: 'Test Runner', icon: '🧪' },
  { path: '/logs', label: 'Debug Logs', icon: '📋' },
  { path: '/about', label: 'About', icon: 'ℹ️' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Header with logo */}
      <div className="sidebar-header">
        <img src={logoImage} alt="Claude Owl" className="sidebar-logo" />
        {!isCollapsed && <span className="sidebar-title">Claude Owl [Beta]</span>}
      </div>

      {/* Navigation items */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
            title={isCollapsed ? item.label : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            {!isCollapsed && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Toggle button */}
      <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
        <span className="toggle-icon">{isCollapsed ? '→' : '←'}</span>
      </button>
    </aside>
  );
};
