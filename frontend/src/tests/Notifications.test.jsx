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

const { mockNotifications, deleteNotification, markAllNotificationsAsRead } = vi.hoisted(() => ({
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
        title: 'Comment added',
        message: 'New comment on "Launch site"',
        isRead: true,
        createdAt: '2026-07-30T10:00:00.000Z',
      },
    ],
    pagination: { page: 1, limit: 15, total: 2, totalPages: 1, hasNextPage: false, hasPrevPage: false },
  },
  deleteNotification: vi.fn().mockResolvedValue({ _id: 'n2' }),
  markAllNotificationsAsRead: vi.fn().mockResolvedValue({}),
}));

vi.mock('../services/notificationsApi', () => ({
  listNotifications: vi.fn().mockResolvedValue(mockNotifications),
  getUnreadCount: vi.fn().mockResolvedValue(1),
  markNotificationAsRead: vi.fn().mockResolvedValue({ _id: 'n1', isRead: true }),
  markAllNotificationsAsRead,
  deleteNotification,
}));

import Notifications from '../pages/Notifications';

const buildStore = () =>
  configureStore({ reducer: { auth: authReducer, theme: themeReducer, ui: uiReducer } });

const renderPage = () => {
  const store = buildStore();
  store.dispatch(
    setCredentials({ user: { _id: 'u1', name: 'Ada Lovelace', role: 'team_member' }, accessToken: 'token' })
  );

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Notifications />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
};

beforeEach(() => {
  queryClient.clear();
  vi.clearAllMocks();
});

describe('Notifications page', () => {
  it('renders the notification history list', async () => {
    renderPage();

    expect(await screen.findByText('Task assigned')).toBeInTheDocument();
    expect(screen.getByText('Comment added')).toBeInTheDocument();
  });

  it('dismisses a notification', async () => {
    renderPage();

    await screen.findByText('Comment added');
    fireEvent.click(screen.getAllByLabelText(/dismiss notification/i)[1]);

    await waitFor(() => expect(deleteNotification).toHaveBeenCalled());
    expect(deleteNotification.mock.calls[0][0]).toBe('n2');
  });

  it('marks all as read from the header action', async () => {
    renderPage();

    await screen.findByText('Task assigned');
    fireEvent.click(screen.getByRole('button', { name: /mark all as read/i }));

    await waitFor(() => expect(markAllNotificationsAsRead).toHaveBeenCalled());
  });

  it('switches to the unread tab', async () => {
    renderPage();

    await screen.findByText('Task assigned');
    fireEvent.click(screen.getByRole('button', { name: 'Unread' }));

    expect(await screen.findByText('Task assigned')).toBeInTheDocument();
  });
});
