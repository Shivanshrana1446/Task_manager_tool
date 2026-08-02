import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setCredentials } from '../redux/slices/authSlice';
import themeReducer from '../redux/slices/themeSlice';
import uiReducer from '../redux/slices/uiSlice';
import { queryClient } from '../services/queryClient';

const { mockNotifications, markAllNotificationsAsRead, markNotificationAsRead } = vi.hoisted(() => ({
  mockNotifications: {
    notifications: [
      {
        _id: 'n1',
        title: 'Task assigned',
        message: 'You were assigned to "Launch site"',
        isRead: false,
        createdAt: '2026-08-01T10:00:00.000Z',
      },
      {
        _id: 'n2',
        title: 'Project updated',
        message: '"Apollo Launch" was updated',
        isRead: true,
        createdAt: '2026-07-30T10:00:00.000Z',
      },
    ],
    pagination: { page: 1, limit: 8, total: 2, totalPages: 1, hasNextPage: false, hasPrevPage: false },
  },
  markAllNotificationsAsRead: vi.fn().mockResolvedValue({}),
  markNotificationAsRead: vi.fn().mockResolvedValue({ _id: 'n1', isRead: true }),
}));

vi.mock('../services/notificationsApi', () => ({
  listNotifications: vi.fn().mockResolvedValue(mockNotifications),
  getUnreadCount: vi.fn().mockResolvedValue(1),
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification: vi.fn(),
}));

import NotificationBell from '../components/notifications/NotificationBell';

const buildStore = () =>
  configureStore({ reducer: { auth: authReducer, theme: themeReducer, ui: uiReducer } });

const renderBell = () => {
  const store = buildStore();
  store.dispatch(
    setCredentials({ user: { _id: 'u1', name: 'Ada Lovelace', role: 'team_member' }, accessToken: 'token' })
  );

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <NotificationBell />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
};

beforeEach(() => {
  queryClient.clear();
  vi.clearAllMocks();
});

describe('NotificationBell', () => {
  it('shows the unread count badge', async () => {
    renderBell();
    expect(await screen.findByText('1')).toBeInTheDocument();
  });

  it('opens the dropdown and lists recent notifications', async () => {
    renderBell();

    fireEvent.click(screen.getByLabelText(/notifications/i));

    expect(await screen.findByText('Task assigned')).toBeInTheDocument();
    expect(screen.getByText('Project updated')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view all notifications/i })).toHaveAttribute(
      'href',
      '/notifications'
    );
  });

  it('marks all as read from the dropdown', async () => {
    renderBell();

    fireEvent.click(screen.getByLabelText(/notifications/i));
    await screen.findByText('Task assigned');

    fireEvent.click(screen.getByRole('button', { name: /mark all as read/i }));

    await waitFor(() => expect(markAllNotificationsAsRead).toHaveBeenCalled());
  });

  it('marks a single unread notification as read on click', async () => {
    renderBell();

    fireEvent.click(screen.getByLabelText(/notifications/i));
    const item = await screen.findByText('Task assigned');

    fireEvent.click(item);

    await waitFor(() => expect(markNotificationAsRead).toHaveBeenCalled());
    expect(markNotificationAsRead.mock.calls[0][0]).toBe('n1');
  });
});
