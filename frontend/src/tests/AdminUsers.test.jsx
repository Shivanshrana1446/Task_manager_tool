import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setCredentials } from '../redux/slices/authSlice';
import { queryClient } from '../services/queryClient';

const { mockUsersResponse, updateUserRole, updateUserStatus, deleteUser } = vi.hoisted(() => ({
  mockUsersResponse: {
    users: [
      {
        _id: 'admin-1',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        role: 'admin',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        _id: 'member-1',
        name: 'Grace Hopper',
        email: 'grace@example.com',
        role: 'team_member',
        isActive: true,
        createdAt: '2026-02-01T00:00:00.000Z',
      },
    ],
    pagination: { page: 1, limit: 10, total: 2, totalPages: 1, hasNextPage: false, hasPrevPage: false },
  },
  updateUserRole: vi.fn().mockResolvedValue({ _id: 'member-1', role: 'project_manager' }),
  updateUserStatus: vi.fn().mockResolvedValue({ _id: 'member-1', isActive: false }),
  deleteUser: vi.fn().mockResolvedValue({ _id: 'member-1' }),
}));

vi.mock('../services/usersApi', () => ({
  searchUsers: vi.fn().mockResolvedValue(mockUsersResponse),
  updateUserRole,
  updateUserStatus,
  deleteUser,
}));

import AdminUsers from '../pages/admin/AdminUsers';

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
          <AdminUsers />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
};

beforeEach(() => {
  queryClient.clear();
  vi.clearAllMocks();
});

describe('AdminUsers page', () => {
  it('lists users with role and status controls', async () => {
    renderPage();

    expect(await screen.findByText('Grace Hopper')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getAllByText('Active')).toHaveLength(2);
  });

  it('changes a user role', async () => {
    renderPage();
    await screen.findByText('Grace Hopper');

    const roleSelects = screen.getAllByRole('combobox').filter((el) => el.value === 'team_member');
    fireEvent.change(roleSelects[0], { target: { value: 'project_manager' } });

    await waitFor(() => expect(updateUserRole).toHaveBeenCalled());
    expect(updateUserRole.mock.calls[0][0]).toBe('member-1');
    expect(updateUserRole.mock.calls[0][1]).toBe('project_manager');
  });

  it('toggles a user status', async () => {
    renderPage();
    await screen.findByText('Grace Hopper');

    fireEvent.click(screen.getByLabelText('Toggle status for Grace Hopper'));

    await waitFor(() => expect(updateUserStatus).toHaveBeenCalled());
    expect(updateUserStatus.mock.calls[0][0]).toBe('member-1');
    expect(updateUserStatus.mock.calls[0][1]).toBe(false);
  });

  it('deletes a user via the confirm dialog', async () => {
    renderPage();
    await screen.findByText('Grace Hopper');

    fireEvent.click(screen.getByLabelText('Delete Grace Hopper'));
    expect(await screen.findByRole('dialog', { name: /delete user/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => expect(deleteUser).toHaveBeenCalled());
    expect(deleteUser.mock.calls[0][0]).toBe('member-1');
  });
});
