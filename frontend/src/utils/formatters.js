const compactFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

export const compactNumber = (value) => compactFormatter.format(value ?? 0);

export const formatShortDate = (value) => dateFormatter.format(new Date(value));

export const formatRelativeTime = (value) => {
  const date = new Date(value);
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return formatShortDate(value);
};

export const formatDueLabel = (value) => {
  const due = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);

  const dayDiff = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (dayDiff === 0) return 'Today';
  if (dayDiff === 1) return 'Tomorrow';
  if (dayDiff === -1) return 'Yesterday';
  if (dayDiff < 0) return `${Math.abs(dayDiff)}d overdue`;
  if (dayDiff < 7) return `In ${dayDiff}d`;
  return formatShortDate(value);
};
