import { useQuery } from '@tanstack/react-query';
import { listAuditLogs, getAdminAnalytics, getSystemHealth, listRoles } from '../services/adminApi';

export const useAuditLogsList = (params) =>
  useQuery({
    queryKey: ['admin', 'audit-logs', params],
    queryFn: () => listAuditLogs(params),
    placeholderData: (previous) => previous,
    staleTime: 15 * 1000,
  });

export const useAdminAnalytics = () =>
  useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: getAdminAnalytics,
    staleTime: 30 * 1000,
  });

export const useSystemHealth = () =>
  useQuery({
    queryKey: ['admin', 'system-health'],
    queryFn: getSystemHealth,
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000,
  });

export const useRolesOverview = () =>
  useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: listRoles,
    staleTime: 30 * 1000,
  });
