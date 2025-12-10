import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  WelcomeCard,
  TokensCard,
  CostCard,
  ActivityCard,
  ModelCard,
  ProjectsCard,
  BadgesCard,
  FunFactsCard,
} from '@/renderer/components/year-review/cards';
import type { YearReviewData } from '@/shared/types';

const mockData: YearReviewData = {
  metrics: {
    sessions: [
      {
        sessionId: 'session-1',
        projectPath: '/home/user/project1',
        startTime: new Date('2025-06-01T10:00:00Z'),
        messages: [
          {
            model: 'claude-sonnet-4-5-20250929',
            inputTokens: 500000,
            outputTokens: 500000,
            cacheCreationTokens: 50000,
            cacheReadTokens: 100000,
            timestamp: new Date('2025-06-01T10:00:00Z'),
          },
        ],
        cost: 50.0,
        totalTokens: 1150000,
        cacheEfficiency: 66.7,
      },
    ],
    daily: [],
    byModel: [],
    byProject: [],
    summary: {
      totalSessions: 100,
      totalMessages: 500,
      totalInputTokens: 500000,
      totalOutputTokens: 500000,
      totalCacheCreationTokens: 50000,
      totalCacheReadTokens: 100000,
      totalTokens: 1150000,
      totalCost: 50.0,
      daysActive: 100,
      topModel: 'claude-3-sonnet-20240229',
      averageCostPerSession: 0.5,
      cacheEfficiency: 66.7,
      dateRange: { start: '2025-01-01', end: '2025-12-31' },
    },
  },
  summary: {
    totalSessions: 100,
    totalMessages: 500,
    totalInputTokens: 500000,
    totalOutputTokens: 500000,
    totalCacheCreationTokens: 50000,
    totalCacheReadTokens: 100000,
    totalTokens: 1150000,
    totalCost: 50.0,
    daysActive: 100,
    topModel: 'claude-3-sonnet-20240229',
    averageCostPerSession: 0.5,
    cacheEfficiency: 66.7,
    dateRange: { start: '2025-01-01', end: '2025-12-31' },
  },
  daily: [],
  byModel: [
    {
      model: 'claude-3-sonnet-20240229',
      messageCount: 400,
      sessionCount: 80,
      inputTokens: 400000,
      outputTokens: 400000,
      cacheCreationTokens: 40000,
      cacheReadTokens: 80000,
      totalTokens: 920000,
      cost: 40.0,
      percentage: 80,
    },
    {
      model: 'claude-3-opus-20240229',
      messageCount: 100,
      sessionCount: 20,
      inputTokens: 100000,
      outputTokens: 100000,
      cacheCreationTokens: 10000,
      cacheReadTokens: 20000,
      totalTokens: 230000,
      cost: 10.0,
      percentage: 20,
    },
  ],
  byProject: [
    {
      projectPath: '/home/user/project1',
      projectName: 'my-awesome-project',
      sessionCount: 50,
      totalTokens: 500000,
      cost: 25.0,
      lastActivity: new Date('2025-12-15'),
      topModel: 'claude-3-sonnet-20240229',
    },
    {
      projectPath: '/home/user/project2',
      projectName: 'another-project',
      sessionCount: 30,
      totalTokens: 300000,
      cost: 15.0,
      lastActivity: new Date('2025-12-10'),
      topModel: 'claude-3-sonnet-20240229',
    },
    {
      projectPath: '/home/user/project3',
      projectName: 'side-project',
      sessionCount: 20,
      totalTokens: 200000,
      cost: 10.0,
      lastActivity: new Date('2025-11-15'),
      topModel: 'claude-3-opus-20240229',
    },
  ],
  badges: [
    {
      id: 'centurion',
      name: 'Centurion',
      emoji: '💯',
      description: '100+ sessions',
      detail: '100 sessions',
      earned: true,
    },
    {
      id: 'million-club',
      name: 'Million Club',
      emoji: '🎰',
      description: '1M+ tokens',
      detail: '1.15M tokens',
      earned: true,
    },
    {
      id: 'cache-master',
      name: 'Cache Master',
      emoji: '💎',
      description: '50%+ cache efficiency',
      detail: '67% cache efficiency',
      earned: true,
    },
    {
      id: 'early-bird',
      name: 'Early Bird',
      emoji: '🌅',
      description: '20+ sessions before 8am',
      detail: '5 sessions before 8am',
      earned: false,
    },
  ],
  activityStats: {
    peakMonth: {
      name: 'June',
      monthIndex: 5,
      sessions: 25,
      tokens: 250000,
      cost: 12.5,
    },
    peakDay: {
      date: '2025-06-15',
      dayOfWeek: 'Sunday',
      sessions: 10,
    },
    monthlyData: [
      { month: '2025-01', monthName: 'Jan', sessions: 10, tokens: 100000, cost: 5 },
      { month: '2025-06', monthName: 'Jun', sessions: 25, tokens: 250000, cost: 12.5 },
    ],
    longestStreak: 15,
    totalDaysActive: 100,
  },
  shareStats: {
    totalTokens: 1150000,
    totalTokensFormatted: '1.2M',
    totalCost: 50.0,
    totalSessions: 100,
    longestStreak: 15,
    topModel: 'claude-3-sonnet-20240229',
    topModelShort: '3 Sonnet',
    topProject: 'my-awesome-project',
    cacheEfficiency: 66.7,
    badgeCount: 3,
  },
  funFacts: [
    {
      id: 'avg-messages',
      icon: '💬',
      title: 'Messages per Session',
      value: '5.0',
      detail: 'You exchanged 500 messages with Claude',
    },
    {
      id: 'top-day',
      icon: '📊',
      title: 'Favorite Day',
      value: 'Sunday',
      detail: '20 sessions on Sundays',
    },
  ],
  tokenComparison: "That's 1.5x the length of the Bible!",
  costComparison: 'About 3 months of Netflix',
  modelPersonality: {
    title: 'The Balanced Genius',
    description: 'You appreciate quality AND speed. Smart choice!',
    emoji: '🎯',
  },
};

describe('WelcomeCard', () => {
  it('renders welcome content', () => {
    render(<WelcomeCard />);

    expect(screen.getByText('Your 2025')).toBeInTheDocument();
    expect(screen.getByText('Year in Review')).toBeInTheDocument();
  });

  it('shows call to action', () => {
    render(<WelcomeCard />);

    expect(screen.getByText(/Click Next to begin/i)).toBeInTheDocument();
  });
});

describe('TokensCard', () => {
  it('renders formatted token count', () => {
    render(<TokensCard data={mockData} />);

    // formatNumber(1150000) returns '1.1M'
    expect(screen.getByText('1.1M')).toBeInTheDocument();
    expect(screen.getByText('tokens')).toBeInTheDocument();
  });

  it('shows input/output/cached breakdown', () => {
    render(<TokensCard data={mockData} />);

    expect(screen.getByText('Input')).toBeInTheDocument();
    expect(screen.getByText('Output')).toBeInTheDocument();
    expect(screen.getByText('Cached')).toBeInTheDocument();
  });
});

describe('CostCard', () => {
  it('renders total cost', () => {
    render(<CostCard data={mockData} />);

    expect(screen.getByText('$50.00')).toBeInTheDocument();
  });

  it('shows cost comparison text', () => {
    render(<CostCard data={mockData} />);

    expect(screen.getByText(/Netflix/i)).toBeInTheDocument();
  });

  it('shows cache efficiency when applicable', () => {
    render(<CostCard data={mockData} />);

    expect(screen.getByText(/cache efficiency/i)).toBeInTheDocument();
  });
});

describe('ActivityCard', () => {
  it('renders peak month with fire emoji', () => {
    render(<ActivityCard data={mockData} />);

    expect(screen.getByText(/June/)).toBeInTheDocument();
    expect(screen.getByText(/🔥 June 🔥/)).toBeInTheDocument();
  });

  it('shows peak day info', () => {
    render(<ActivityCard data={mockData} />);

    expect(screen.getByText(/Sunday/)).toBeInTheDocument();
    expect(screen.getByText(/10 sessions that day/i)).toBeInTheDocument();
  });

  it('shows days active count', () => {
    render(<ActivityCard data={mockData} />);

    expect(screen.getByText(/100/)).toBeInTheDocument();
    expect(screen.getByText(/days in 2025/i)).toBeInTheDocument();
  });
});

describe('ModelCard', () => {
  it('renders favorite model heading', () => {
    render(<ModelCard data={mockData} />);

    expect(screen.getByText(/Your Favorite Claude/i)).toBeInTheDocument();
  });

  it('shows model personality info', () => {
    render(<ModelCard data={mockData} />);

    expect(screen.getByText(/The Balanced Genius/i)).toBeInTheDocument();
    expect(screen.getByText(mockData.modelPersonality.description)).toBeInTheDocument();
  });

  it('shows model percentages in breakdown', () => {
    render(<ModelCard data={mockData} />);

    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });
});

describe('ProjectsCard', () => {
  it('renders top projects', () => {
    render(<ProjectsCard data={mockData} />);

    expect(screen.getByText('my-awesome-project')).toBeInTheDocument();
    expect(screen.getByText('another-project')).toBeInTheDocument();
    expect(screen.getByText('side-project')).toBeInTheDocument();
  });

  it('shows medal rankings', () => {
    render(<ProjectsCard data={mockData} />);

    expect(screen.getByText('🥇')).toBeInTheDocument();
    expect(screen.getByText('🥈')).toBeInTheDocument();
    expect(screen.getByText('🥉')).toBeInTheDocument();
  });

  it('shows projects count message', () => {
    render(<ProjectsCard data={mockData} />);

    expect(screen.getByText(/different/i)).toBeInTheDocument();
    expect(screen.getByText(/projects this year/i)).toBeInTheDocument();
  });
});

describe('BadgesCard', () => {
  it('renders earned badge names', () => {
    render(<BadgesCard data={mockData} />);

    expect(screen.getByText('Centurion')).toBeInTheDocument();
    expect(screen.getByText('Million Club')).toBeInTheDocument();
    expect(screen.getByText('Cache Master')).toBeInTheDocument();
  });

  it('shows earned badge count text', () => {
    render(<BadgesCard data={mockData} />);

    expect(screen.getByText(/earned 3 of 4 badges/i)).toBeInTheDocument();
  });

  it('shows unearned badge section', () => {
    render(<BadgesCard data={mockData} />);

    expect(screen.getByText(/Badges to unlock next year/i)).toBeInTheDocument();
  });
});

describe('FunFactsCard', () => {
  it('renders fun facts', () => {
    render(<FunFactsCard data={mockData} />);

    expect(screen.getByText('Messages per Session')).toBeInTheDocument();
    expect(screen.getByText('5.0')).toBeInTheDocument();
  });

  it('shows multiple fun facts', () => {
    render(<FunFactsCard data={mockData} />);

    expect(screen.getByText('Favorite Day')).toBeInTheDocument();
    expect(screen.getByText('Sunday')).toBeInTheDocument();
  });
});
