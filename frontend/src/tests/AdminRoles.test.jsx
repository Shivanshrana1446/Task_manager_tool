import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../services/queryClient';

const { mockRoles } = vi.hoisted(() => ({
  mockRoles: [
    {
      role: 'admin',
      label: 'Administrator',
      description: 'Full access to every resource.',
      permissions: ['Manage users, roles, and teams'],
      userCount: 2,
    },
    {
      role: 'project_manager',
      label: 'Project Manager',
      description: 'Owns and manages projects.',
      permissions: ['Create and manage owned projects'],
      userCount: 3,
    },
    {
      role: 'team_member',
      label: 'Team Member',
      description: 'Works on assigned tasks.',
      permissions: ['View and update assigned tasks'],
      userCount: 7,
    },
  ],
}));

vi.mock('../services/adminApi', () => ({
  listRoles: vi.fn().mockResolvedValue(mockRoles),
  getAdminAnalytics: vi.fn(),
  getSystemHealth: vi.fn(),
  listAuditLogs: vi.fn(),
}));

import AdminRoles from '../pages/admin/AdminRoles';

describe('AdminRoles page', () => {
  it('renders each role with its description, permissions, and user count', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdminRoles />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText('Administrator')).toBeInTheDocument();
    expect(screen.getByText('Project Manager')).toBeInTheDocument();
    expect(screen.getByText('Team Member')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getAllByText(/view users/i)).toHaveLength(3);
  });
});
