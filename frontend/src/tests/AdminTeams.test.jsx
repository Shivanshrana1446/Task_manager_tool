import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setCredentials } from '../redux/slices/authSlice';
import { queryClient } from '../services/queryClient';

const { mockTeamsResponse, createTeam, deleteTeam } = vi.hoisted(() => ({
  mockTeamsResponse: {
    teams: [
      {
        _id: 'team-1',
        name: 'Platform Engineering',
        description: 'Owns core infra',
        lead: { _id: 'u1', name: 'Ada Lovelace', avatar: null },
        members: [{ _id: 'u2', name: 'Grace Hopper', avatar: null }],
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasNextPage: false, hasPrevPage: false },
  },
  createTeam: vi.fn().mockResolvedValue({ _id: 'team-2', name: 'New Squad' }),
  deleteTeam: vi.fn().mockResolvedValue({ _id: 'team-1' }),
}));

vi.mock('../services/teamsApi', () => ({
  listTeams: vi.fn().mockResolvedValue(mockTeamsResponse),
  createTeam,
  updateTeam: vi.fn(),
  deleteTeam,
  restoreTeam: vi.fn(),
  addTeamMembers: vi.fn(),
  removeTeamMember: vi.fn(),
  assignTeamLead: vi.fn(),
}));

vi.mock('../services/usersApi', () => ({
  searchUsers: vi.fn().mockResolvedValue({ users: [] }),
}));

import AdminTeams from '../pages/admin/AdminTeams';

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
          <AdminTeams />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
};

beforeEach(() => {
  queryClient.clear();
  vi.clearAllMocks();
});

describe('AdminTeams page', () => {
  it('lists teams with lead and member info', async () => {
    renderPage();

    expect(await screen.findByText('Platform Engineering')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('opens the new-team modal from the header button', async () => {
    renderPage();
    await screen.findByText('Platform Engineering');

    fireEvent.click(screen.getByRole('button', { name: /new team/i }));

    expect(await screen.findByRole('dialog', { name: /new team/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/team name/i)).toBeInTheDocument();
  });

  it('deletes a team via the confirm dialog', async () => {
    renderPage();
    await screen.findByText('Platform Engineering');

    fireEvent.click(screen.getByLabelText('Delete Platform Engineering'));
    expect(await screen.findByRole('dialog', { name: /delete team/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => expect(deleteTeam).toHaveBeenCalled());
    expect(deleteTeam.mock.calls[0][0]).toBe('team-1');
  });
});
