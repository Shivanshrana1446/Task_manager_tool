import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '../services/dashboardApi';

// Shared so task/project mutations elsewhere can invalidate the dashboard's
// cached numbers instead of leaving them stale until staleTime expires.
export const DASHBOARD_SUMMARY_KEY = ['dashboard', 'summary'];

export const useDashboardSummary = () =>
  useQuery({
    queryKey: DASHBOARD_SUMMARY_KEY,
    queryFn: getDashboardSummary,
    staleTime: 60 * 1000,
  });
