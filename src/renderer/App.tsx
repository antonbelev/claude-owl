import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/Layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { SettingsPage } from './pages/SettingsPage';
import { AgentsPage } from './pages/AgentsPage';
import { SkillsPage } from './pages/SkillsPage';
import { PluginsPage } from './pages/PluginsPage';
import { CommandsPage } from './pages/CommandsPage';
import { HooksPage } from './pages/HooksPage';
import { MCPPage } from './pages/MCPPage';
import { SessionsPage } from './pages/SessionsPage';
import { TestsPage } from './pages/TestsPage';
import { LogsPage } from './pages/LogsPage';

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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="agents" element={<AgentsPage />} />
            <Route path="skills" element={<SkillsPage />} />
            <Route path="plugins" element={<PluginsPage />} />
            <Route path="commands" element={<CommandsPage />} />
            <Route path="hooks" element={<HooksPage />} />
            <Route path="mcp" element={<MCPPage />} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="tests" element={<TestsPage />} />
            <Route path="logs" element={<LogsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
