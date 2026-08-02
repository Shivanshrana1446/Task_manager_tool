import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../services/queryClient';

const { mockLogsResponse, listAuditLogs } = vi.hoisted(() => ({
  mockLogsResponse: {
    logs: [
      {
        _id: 'log-1',
        user: { _id: 'u1', name: 'Ada Lovelace', avatar: null },
        action: 'create',
        entityType: 'Project',
        entityId: '65f0000000000000000001',
        ipAddress: '127.0.0.1',
        createdAt: '2026-08-01T12:00:00.000Z',
      },
      {
        _id: 'log-2',
        user: null,
        action: 'login',
        entityType: 'User',
        entityId: '65f0000000000000000002',
        ipAddress: '127.0.0.1',
        createdAt: '2026-08-01T11:00:00.000Z',
      },
    ],
    pagination: { page: 1, limit: 15, total: 2, totalPages: 1, hasNextPage: false, hasPrevPage: false },
  },
  listAuditLogs: vi.fn(),
}));

listAuditLogs.mockResolvedValue(mockLogsResponse);

vi.mock('../services/adminApi', () => ({
  listAuditLogs,
  getAdminAnalytics: vi.fn(),
  getSystemHealth: vi.fn(),
  listRoles: vi.fn(),
}));

import AdminAuditLogs from '../pages/admin/AdminAuditLogs';

beforeEach(() => {
  queryClient.clear();
  vi.clearAllMocks();
  listAuditLogs.mockResolvedValue(mockLogsResponse);
});

describe('AdminAuditLogs page', () => {
  it('lists audit log entries with actor and action', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AdminAuditLogs />
      </QueryClientProvider>
    );

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getByText('Created')).toBeInTheDocument();
    expect(within(table).getByText('System')).toBeInTheDocument();
    expect(within(table).getByText('Logged in')).toBeInTheDocument();
  });

  it('filters by action', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AdminAuditLogs />
      </QueryClientProvider>
    );

    await screen.findByText('Ada Lovelace');

    const actionSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(actionSelect, { target: { value: 'create' } });

    await waitFor(() =>
      expect(listAuditLogs.mock.calls.some(([params]) => params.action === 'create')).toBe(true)
    );
  });
});
