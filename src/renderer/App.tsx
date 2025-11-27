import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectProvider } from './contexts/ProjectContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppLayout } from './components/Layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { SettingsPage } from './pages/SettingsPage';
import { StatusLinePage } from './pages/StatusLinePage';
import { AgentsPage } from './pages/AgentsPage';
import { SkillsPage } from './pages/SkillsPage';
import { PluginsPage } from './pages/PluginsPage';
import { CommandsPage } from './pages/CommandsPage';
import { HooksPage } from './pages/HooksPage';
import { MCPPage } from './pages/MCPPage';
import { MetricsPage } from './pages/MetricsPage';
import { TestsPage } from './pages/TestsPage';
import { LogsPage } from './pages/LogsPage';
import { AboutPage } from './pages/AboutPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ProjectProvider>
          <HashRouter>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="statusline" element={<StatusLinePage />} />
                <Route path="agents" element={<AgentsPage />} />
                <Route path="skills" element={<SkillsPage />} />
                <Route path="plugins" element={<PluginsPage />} />
                <Route path="commands" element={<CommandsPage />} />
                <Route path="hooks" element={<HooksPage />} />
                <Route path="mcp" element={<MCPPage />} />
                <Route path="metrics" element={<MetricsPage />} />
                <Route path="tests" element={<TestsPage />} />
                <Route path="logs" element={<LogsPage />} />
                <Route path="about" element={<AboutPage />} />
              </Route>
            </Routes>
          </HashRouter>
        </ProjectProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
