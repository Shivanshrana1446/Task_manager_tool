import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setCredentials } from '../redux/slices/authSlice';
import themeReducer from '../redux/slices/themeSlice';
import uiReducer from '../redux/slices/uiSlice';
import { queryClient } from '../services/queryClient';

const { mockProjectsResponse } = vi.hoisted(() => ({
  mockProjectsResponse: {
    projects: [
      {
        _id: 'p1',
        name: 'Apollo Launch',
        description: 'Send the rocket up',
        status: 'active',
        priority: 'high',
        startDate: '2026-01-01T00:00:00.000Z',
        dueDate: '2026-12-01T00:00:00.000Z',
        owner: { _id: 'u1', name: 'Ada Lovelace', avatar: null },
        members: [{ _id: 'u2', name: 'Grace Hopper', avatar: null }],
        taskStats: { total: 4, completed: 2, progress: 50 },
      },
      {
        _id: 'p2',
        name: 'Retro Site',
        description: 'Rebuild the marketing site',
        status: 'planning',
        priority: 'medium',
        startDate: null,
        dueDate: null,
        owner: { _id: 'u1', name: 'Ada Lovelace', avatar: null },
        members: [],
        taskStats: { total: 0, completed: 0, progress: 0 },
      },
    ],
    pagination: { page: 1, limit: 9, total: 2, totalPages: 1, hasNextPage: false, hasPrevPage: false },
  },
}));

vi.mock('../services/projectsApi', () => ({
  listProjects: vi.fn().mockResolvedValue(mockProjectsResponse),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  addProjectMembers: vi.fn(),
  removeProjectMember: vi.fn(),
  assignProjectManager: vi.fn(),
}));

vi.mock('../services/usersApi', () => ({
  searchUsers: vi.fn().mockResolvedValue({ users: [] }),
}));

import Projects from '../pages/Projects';

const buildStore = () =>
  configureStore({ reducer: { auth: authReducer, theme: themeReducer, ui: uiReducer } });

const renderProjects = () => {
  const store = buildStore();
  store.dispatch(
    setCredentials({ user: { _id: 'u1', name: 'Ada Lovelace', role: 'team_member' }, accessToken: 'token' })
  );

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Projects />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
};

describe('Projects page', () => {
  it('renders project cards with status, progress, and pagination', async () => {
    renderProjects();

    expect(await screen.findByText('Apollo Launch')).toBeInTheDocument();
    expect(screen.getByText('Retro Site')).toBeInTheDocument();
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Planning').length).toBeGreaterThan(0);
    expect(screen.getByText('2/4 tasks')).toBeInTheDocument();
  });

  it('opens the create-project modal from the header button', async () => {
    renderProjects();

    await screen.findByText('Apollo Launch');
    fireEvent.click(screen.getByRole('button', { name: /new project/i }));

    expect(await screen.findByRole('dialog', { name: /new project/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
  });
});
