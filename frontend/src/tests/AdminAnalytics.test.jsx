import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setCredentials } from '../redux/slices/authSlice';
import { queryClient } from '../services/queryClient';

const { mockAnalytics } = vi.hoisted(() => ({
  mockAnalytics: {
    cards: {
      totalUsers: 12,
      activeUsers: 10,
      totalProjects: 5,
      activeProjects: 3,
      totalTasks: 40,
      completedTasks: 22,
      overdueTasks: 2,
      totalTeams: 4,
    },
    charts: {
      usersByRole: [
        { role: 'admin', count: 2 },
        { role: 'project_manager', count: 3 },
        { role: 'team_member', count: 7 },
      ],
      projectsByStatus: [
        { status: 'planning', count: 1 },
        { status: 'active', count: 3 },
        { status: 'on_hold', count: 0 },
        { status: 'completed', count: 1 },
        { status: 'archived', count: 0 },
      ],
      tasksByStatus: [
        { status: 'todo', count: 10 },
        { status: 'in_progress', count: 5 },
        { status: 'in_review', count: 3 },
        { status: 'done', count: 22 },
        { status: 'cancelled', count: 0 },
      ],
      monthlyUserGrowth: [
        { month: '2026-03', label: 'Mar', count: 1 },
        { month: '2026-04', label: 'Apr', count: 2 },
        { month: '2026-05', label: 'May', count: 0 },
        { month: '2026-06', label: 'Jun', count: 3 },
        { month: '2026-07', label: 'Jul', count: 1 },
        { month: '2026-08', label: 'Aug', count: 5 },
      ],
      monthlyTaskCompletion: [
        { month: '2026-03', label: 'Mar', completed: 2 },
        { month: '2026-04', label: 'Apr', completed: 4 },
        { month: '2026-05', label: 'May', completed: 1 },
        { month: '2026-06', label: 'Jun', completed: 6 },
        { month: '2026-07', label: 'Jul', completed: 3 },
        { month: '2026-08', label: 'Aug', completed: 6 },
      ],
      topContributors: [
        { userId: 'u1', name: 'Ada Lovelace', avatar: null, role: 'admin', assigned: 5, completed: 4 },
      ],
    },
  },
}));

vi.mock('../services/adminApi', () => ({
  getAdminAnalytics: vi.fn().mockResolvedValue(mockAnalytics),
  listAuditLogs: vi.fn(),
  getSystemHealth: vi.fn(),
  listRoles: vi.fn(),
}));

import AdminAnalytics from '../pages/admin/AdminAnalytics';

const buildStore = () => configureStore({ reducer: { auth: authReducer } });

describe('AdminAnalytics page', () => {
  it('renders overview cards and chart titles once data loads', async () => {
    const store = buildStore();
    store.dispatch(setCredentials({ user: { name: 'Ada Lovelace', role: 'admin' }, accessToken: 'token' }));

    render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <AdminAnalytics />
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>
    );

    expect(await screen.findByText('Total users')).toBeInTheDocument();
    expect(screen.getByText('Users by role')).toBeInTheDocument();
    expect(screen.getByText('Projects by status')).toBeInTheDocument();
    expect(screen.getByText('Tasks by status')).toBeInTheDocument();
    expect(screen.getByText('New users')).toBeInTheDocument();
    expect(screen.getByText('Task completion')).toBeInTheDocument();
    expect(screen.getByText('Top contributors')).toBeInTheDocument();
  });
});
