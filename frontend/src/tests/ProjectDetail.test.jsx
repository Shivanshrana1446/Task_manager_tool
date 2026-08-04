import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setCredentials } from '../redux/slices/authSlice';
import themeReducer from '../redux/slices/themeSlice';
import uiReducer from '../redux/slices/uiSlice';
import { queryClient } from '../services/queryClient';

const { mockProject, mockTasks } = vi.hoisted(() => ({
  mockProject: {
    _id: 'proj1',
    name: 'Apollo Launch',
    description: 'Send the rocket up',
    status: 'active',
    priority: 'high',
    owner: { _id: 'u1', name: 'Ada Lovelace', avatar: null },
    members: [{ _id: 'u2', name: 'Grace Hopper', avatar: null }],
    taskStats: { total: 2, completed: 1, progress: 50 },
  },
  mockTasks: [
    {
      _id: 't1',
      title: 'Design the fuselage',
      description: '',
      project: 'proj1',
      status: 'todo',
      priority: 'high',
      tags: [],
      assignees: [],
      reporter: { _id: 'u1', name: 'Ada Lovelace' },
      parentTask: null,
      dueDate: null,
      position: 0,
    },
    {
      _id: 't2',
      title: 'Ship the engines',
      description: '',
      project: 'proj1',
      status: 'done',
      priority: 'medium',
      tags: ['hardware'],
      assignees: [{ _id: 'u2', name: 'Grace Hopper', avatar: null }],
      reporter: { _id: 'u1', name: 'Ada Lovelace' },
      parentTask: null,
      dueDate: null,
      position: 0,
    },
  ],
}));

vi.mock('../services/projectsApi', () => ({
  getProject: vi.fn().mockResolvedValue(mockProject),
  listProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  addProjectMembers: vi.fn(),
  removeProjectMember: vi.fn(),
  assignProjectManager: vi.fn(),
}));

vi.mock('../services/tasksApi', () => ({
  listTasks: vi.fn().mockResolvedValue({
    tasks: mockTasks,
    pagination: { page: 1, limit: 10, total: 2, totalPages: 1, hasNextPage: false, hasPrevPage: false },
  }),
  getTask: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  getTaskHistory: vi.fn().mockResolvedValue([]),
}));

vi.mock('../services/usersApi', () => ({
  searchUsers: vi.fn().mockResolvedValue({ users: [] }),
}));

vi.mock('../services/commentsApi', () => ({
  listComments: vi.fn().mockResolvedValue([]),
  createComment: vi.fn(),
  updateComment: vi.fn(),
  deleteComment: vi.fn(),
}));

import ProjectDetail from '../pages/ProjectDetail';

const buildStore = () =>
  configureStore({ reducer: { auth: authReducer, theme: themeReducer, ui: uiReducer } });

const renderProjectDetail = () => {
  const store = buildStore();
  store.dispatch(
    setCredentials({ user: { _id: 'u1', name: 'Ada Lovelace', role: 'team_member' }, accessToken: 'token' })
  );

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/projects/proj1']}>
          <Routes>
            <Route path="/projects/:id" element={<ProjectDetail />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
};

describe('ProjectDetail page', () => {
  it('renders the project header and kanban board with tasks grouped by status', async () => {
    renderProjectDetail();

    expect(await screen.findByText('Apollo Launch')).toBeInTheDocument();
    expect(screen.getByText('Design the fuselage')).toBeInTheDocument();
    expect(screen.getByText('Ship the engines')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new task/i })).toBeInTheDocument();
  });

  it('switches to the table view', async () => {
    renderProjectDetail();

    await screen.findByText('Apollo Launch');
    fireEvent.click(screen.getByRole('button', { name: /^table$/i }));

    expect(await screen.findByRole('columnheader', { name: /^task id$/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^task$/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /due date/i })).toBeInTheDocument();
  });
});
