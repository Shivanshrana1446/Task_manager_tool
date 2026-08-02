import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setCredentials } from '../redux/slices/authSlice';
import { queryClient } from '../services/queryClient';

const { mockProjectsResponse, deleteProject } = vi.hoisted(() => ({
  mockProjectsResponse: {
    projects: [
      {
        _id: 'p1',
        name: 'Apollo Launch',
        description: 'Send the rocket up',
        status: 'active',
        priority: 'high',
        dueDate: '2026-12-01T00:00:00.000Z',
        owner: { _id: 'u1', name: 'Ada Lovelace', avatar: null },
        members: [{ _id: 'u2', name: 'Grace Hopper', avatar: null }],
        taskStats: { total: 4, completed: 2, progress: 50 },
      },
    ],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false },
  },
  deleteProject: vi.fn().mockResolvedValue({ _id: 'p1' }),
}));

vi.mock('../services/projectsApi', () => ({
  listProjects: vi.fn().mockResolvedValue(mockProjectsResponse),
  getProject: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject,
  restoreProject: vi.fn(),
  addProjectMembers: vi.fn(),
  removeProjectMember: vi.fn(),
  assignProjectManager: vi.fn(),
}));

import AdminProjects from '../pages/admin/AdminProjects';

const buildStore = () => configureStore({ reducer: { auth: authReducer } });

const renderPage = () => {
  const store = buildStore();
  store.dispatch(
    setCredentials({ user: { _id: 'admin-1', name: 'Ada Lovelace', role: 'admin' }, accessToken: 'token' })
  );

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdminProjects />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
};

beforeEach(() => {
  queryClient.clear();
  vi.clearAllMocks();
});

describe('AdminProjects page', () => {
  it('lists projects with owner, status, and progress', async () => {
    renderPage();

    expect(await screen.findByText('Apollo Launch')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('2/4 tasks')).toBeInTheDocument();
  });

  it('deletes a project via the confirm dialog', async () => {
    renderPage();
    await screen.findByText('Apollo Launch');

    fireEvent.click(screen.getByLabelText('Delete Apollo Launch'));
    expect(await screen.findByRole('dialog', { name: /delete project/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => expect(deleteProject).toHaveBeenCalled());
    expect(deleteProject.mock.calls[0][0]).toBe('p1');
  });
});
