import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setCredentials } from '../redux/slices/authSlice';
import themeReducer from '../redux/slices/themeSlice';
import uiReducer from '../redux/slices/uiSlice';
import { queryClient } from '../services/queryClient';

const { mockSummary } = vi.hoisted(() => ({
  mockSummary: {
    scope: 'member',
    cards: {
      totalProjects: 3,
      activeProjects: 2,
      completedProjects: 1,
      pendingTasks: 4,
      completedTasks: 5,
      overdueTasks: 1,
      todaysDeadlines: 2,
    },
    charts: {
      taskStatus: [
        { status: 'todo', count: 2 },
        { status: 'in_progress', count: 1 },
        { status: 'in_review', count: 1 },
        { status: 'done', count: 5 },
        { status: 'cancelled', count: 0 },
      ],
      projectProgress: [
        { projectId: '1', name: 'Apollo', totalTasks: 4, completedTasks: 2, progress: 50 },
      ],
      monthlyProductivity: [
        { month: '2026-03', label: 'Mar', completed: 1 },
        { month: '2026-04', label: 'Apr', completed: 2 },
        { month: '2026-05', label: 'May', completed: 0 },
        { month: '2026-06', label: 'Jun', completed: 3 },
        { month: '2026-07', label: 'Jul', completed: 1 },
        { month: '2026-08', label: 'Aug', completed: 2 },
      ],
      teamPerformance: [],
    },
    feeds: {
      recentActivity: [],
      upcomingDeadlines: [],
      recentComments: [],
    },
  },
}));

vi.mock('../services/dashboardApi', () => ({
  getDashboardSummary: vi.fn().mockResolvedValue(mockSummary),
}));

vi.mock('../services/notificationsApi', () => ({
  listNotifications: vi.fn().mockResolvedValue({ notifications: [], pagination: {} }),
  markNotificationAsRead: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
}));

import Dashboard from '../pages/Dashboard';

const buildStore = () =>
  configureStore({ reducer: { auth: authReducer, theme: themeReducer, ui: uiReducer } });

describe('Dashboard page', () => {
  it('renders KPI cards, charts, and feeds once data loads', async () => {
    const store = buildStore();
    store.dispatch(
      setCredentials({ user: { name: 'Ada Lovelace', role: 'team_member' }, accessToken: 'token' })
    );

    render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <Dashboard />
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>
    );

    expect(await screen.findByText(/Total projects/i)).toBeInTheDocument();
    expect(screen.getByText('Task status')).toBeInTheDocument();
    expect(screen.getByText('Project progress')).toBeInTheDocument();
    expect(screen.getByText('Monthly productivity')).toBeInTheDocument();
    expect(screen.getByText('Team performance')).toBeInTheDocument();
    expect(screen.getByText('Recent activity')).toBeInTheDocument();
    expect(await screen.findByText("You're all caught up.")).toBeInTheDocument();
  });
});
