export const chartColor = (token) => `rgb(var(--${token}))`;

// Fixed categorical order — validated for CVD-safe adjacency as a sequence.
// Never reorder these by value; only the semantic label attached to each
// position may change.
export const TASK_STATUS_ORDER = ['todo', 'in_progress', 'in_review', 'testing', 'done', 'cancelled'];

export const TASK_STATUS_COLORS = {
  todo: chartColor('chart-blue'),
  in_progress: chartColor('chart-orange'),
  in_review: chartColor('chart-aqua'),
  testing: chartColor('chart-violet'),
  done: chartColor('chart-yellow'),
  cancelled: chartColor('chart-magenta'),
};

export const TASK_STATUS_LABELS = {
  todo: 'To do',
  in_progress: 'In progress',
  in_review: 'Review',
  testing: 'Testing',
  done: 'Completed',
  cancelled: 'Cancelled',
};

export const PROJECT_STATUS_COLORS = {
  planning: chartColor('chart-muted'),
  active: chartColor('chart-blue'),
  on_hold: chartColor('status-warning'),
  completed: chartColor('status-good'),
  archived: chartColor('chart-magenta'),
};

export const PROJECT_STATUS_LABELS = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On hold',
  completed: 'Completed',
  archived: 'Archived',
};

export const PRIORITY_COLORS = {
  low: chartColor('chart-muted'),
  medium: chartColor('chart-blue'),
  high: chartColor('status-warning'),
  critical: chartColor('status-critical'),
};

export const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const ROLE_ORDER = ['admin', 'project_manager', 'team_member'];

export const ROLE_COLORS = {
  admin: chartColor('chart-blue'),
  project_manager: chartColor('chart-orange'),
  team_member: chartColor('chart-aqua'),
};

export const ROLE_LABELS = {
  admin: 'Admin',
  project_manager: 'Project Manager',
  team_member: 'Team Member',
};

export const CHART_GRID = chartColor('chart-grid');
export const CHART_MUTED = chartColor('chart-muted');
export const CHART_ACCENT = chartColor('chart-blue');
export const CHART_ACCENT_TRACK = 'rgb(var(--chart-blue) / 0.16)';
