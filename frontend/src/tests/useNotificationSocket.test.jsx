import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setCredentials } from '../redux/slices/authSlice';
import uiReducer from '../redux/slices/uiSlice';
import { queryClient } from '../services/queryClient';
import { NOTIFICATIONS_LIST_KEY, UNREAD_COUNT_KEY } from '../hooks/useNotifications';

const { listeners, connectSocket, disconnectSocket } = vi.hoisted(() => ({
  listeners: {},
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}));

vi.mock('../services/socket', () => ({
  socket: {
    on: vi.fn((event, handler) => {
      listeners[event] = handler;
    }),
    off: vi.fn((event) => {
      delete listeners[event];
    }),
  },
  connectSocket,
  disconnectSocket,
}));

import { useNotificationSocket } from '../hooks/useNotificationSocket';

const buildStore = () => configureStore({ reducer: { auth: authReducer, ui: uiReducer } });

const wrapperFor = (store) => {
  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );
  return Wrapper;
};

beforeEach(() => {
  queryClient.clear();
  vi.clearAllMocks();
  Object.keys(listeners).forEach((key) => delete listeners[key]);
});

describe('useNotificationSocket', () => {
  it('connects and registers listeners when authenticated', () => {
    const store = buildStore();
    store.dispatch(setCredentials({ user: { _id: 'u1', name: 'Ada' }, accessToken: 'token' }));

    renderHook(() => useNotificationSocket(), { wrapper: wrapperFor(store) });

    expect(connectSocket).toHaveBeenCalled();
    expect(listeners['notification:new']).toBeInstanceOf(Function);
    expect(listeners['notification:read']).toBeInstanceOf(Function);
    expect(listeners['notification:read-all']).toBeInstanceOf(Function);
  });

  it('bumps unread count and queues a toast on notification:new', () => {
    const store = buildStore();
    store.dispatch(setCredentials({ user: { _id: 'u1', name: 'Ada' }, accessToken: 'token' }));
    renderHook(() => useNotificationSocket(), { wrapper: wrapperFor(store) });

    listeners['notification:new']({ title: 'Task assigned', message: 'You were assigned' });

    expect(queryClient.getQueryData(UNREAD_COUNT_KEY)).toBe(1);
    expect(store.getState().ui.toasts).toHaveLength(1);
    expect(store.getState().ui.toasts[0].title).toBe('Task assigned');
  });

  it('decrements unread count and marks the item read on notification:read', () => {
    const store = buildStore();
    store.dispatch(setCredentials({ user: { _id: 'u1', name: 'Ada' }, accessToken: 'token' }));
    queryClient.setQueryData(UNREAD_COUNT_KEY, 3);
    queryClient.setQueryData([...NOTIFICATIONS_LIST_KEY, {}], {
      notifications: [{ _id: 'n1', isRead: false }],
      pagination: {},
    });

    renderHook(() => useNotificationSocket(), { wrapper: wrapperFor(store) });

    listeners['notification:read']({ id: 'n1' });

    expect(queryClient.getQueryData(UNREAD_COUNT_KEY)).toBe(2);
    expect(queryClient.getQueryData([...NOTIFICATIONS_LIST_KEY, {}]).notifications[0].isRead).toBe(
      true
    );
  });

  it('zeroes the unread count on notification:read-all', () => {
    const store = buildStore();
    store.dispatch(setCredentials({ user: { _id: 'u1', name: 'Ada' }, accessToken: 'token' }));
    queryClient.setQueryData(UNREAD_COUNT_KEY, 5);

    renderHook(() => useNotificationSocket(), { wrapper: wrapperFor(store) });

    listeners['notification:read-all']({});

    expect(queryClient.getQueryData(UNREAD_COUNT_KEY)).toBe(0);
  });

  it('disconnects and tears down listeners when not authenticated', () => {
    const store = buildStore();

    const { unmount } = renderHook(() => useNotificationSocket(), { wrapper: wrapperFor(store) });

    expect(disconnectSocket).toHaveBeenCalled();
    expect(connectSocket).not.toHaveBeenCalled();
    unmount();
  });
});
