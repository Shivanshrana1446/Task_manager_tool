const PROJECT_STATUS = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
};

const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  IN_REVIEW: 'in_review',
  TESTING: 'testing',
  DONE: 'done',
  CANCELLED: 'cancelled',
};

const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

const ENTITY_TYPES = {
  USER: 'User',
  PROJECT: 'Project',
  TASK: 'Task',
  COMMENT: 'Comment',
  ATTACHMENT: 'Attachment',
  TEAM: 'Team',
};

const AUDIT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  RESTORE: 'restore',
  STATUS_CHANGE: 'status_change',
  ASSIGN: 'assign',
  LOGIN: 'login',
  LOGOUT: 'logout',
  COMMENT: 'comment',
  UPLOAD: 'upload',
};

const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_UPDATED: 'task_updated',
  TASK_COMPLETED: 'task_completed',
  COMMENT_ADDED: 'comment_added',
  MENTION: 'mention',
  PROJECT_INVITE: 'project_invite',
  PROJECT_MANAGER_ASSIGNED: 'project_manager_assigned',
  PROJECT_UPDATED: 'project_updated',
  DUE_DATE_REMINDER: 'due_date_reminder',
  STATUS_CHANGE: 'status_change',
};

const ATTACHMENT_LIMITS = {
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'application/zip',
  ],
};

const AVATAR_LIMITS = {
  MAX_FILE_SIZE_MB: 2,
};

const values = (obj) => Object.values(obj);

module.exports = {
  ATTACHMENT_LIMITS,
  AVATAR_LIMITS,
  PROJECT_STATUS,
  PROJECT_STATUS_VALUES: values(PROJECT_STATUS),
  TASK_STATUS,
  TASK_STATUS_VALUES: values(TASK_STATUS),
  PRIORITY,
  PRIORITY_VALUES: values(PRIORITY),
  ENTITY_TYPES,
  ENTITY_TYPE_VALUES: values(ENTITY_TYPES),
  AUDIT_ACTIONS,
  AUDIT_ACTION_VALUES: values(AUDIT_ACTIONS),
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_VALUES: values(NOTIFICATION_TYPES),
};
