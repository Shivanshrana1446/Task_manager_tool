import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../services/queryClient';

const { mockHealth } = vi.hoisted(() => ({
  mockHealth: {
    status: 'ok',
    environment: 'test',
    serverTime: '2026-08-02T12:00:00.000Z',
    uptimeSeconds: 3725,
    node: { version: 'v20.11.0', platform: 'win32', arch: 'x64' },
    memory: { rssMB: 120, heapUsedMB: 80, heapTotalMB: 140, systemFreeMB: 4000, systemTotalMB: 16000 },
    cpu: { cores: 8, loadAverage: [0.5, 0.4, 0.3] },
    database: { status: 'connected', name: 'task_manager', host: 'localhost' },
  },
}));

vi.mock('../services/adminApi', () => ({
  getSystemHealth: vi.fn().mockResolvedValue(mockHealth),
  getAdminAnalytics: vi.fn(),
  listAuditLogs: vi.fn(),
  listRoles: vi.fn(),
}));

import AdminSystemHealth from '../pages/admin/AdminSystemHealth';

describe('AdminSystemHealth page', () => {
  it('renders the server, memory, and database snapshot', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AdminSystemHealth />
      </QueryClientProvider>
    );

    expect(await screen.findByText('connected')).toBeInTheDocument();
    expect(screen.getByText('1h 2m')).toBeInTheDocument();
    expect(screen.getByText(/Node v20.11.0/)).toBeInTheDocument();
    expect(screen.getByText('8 cores')).toBeInTheDocument();
    expect(screen.getByText('All systems normal')).toBeInTheDocument();
  });
});
