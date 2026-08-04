import { z } from 'zod';

export const TASK_STATUSES = ['todo', 'in_progress', 'in_review', 'testing', 'done', 'cancelled'];
// Statuses rendered as Kanban columns, in display order.
export const KANBAN_STATUSES = ['todo', 'in_progress', 'in_review', 'testing', 'done', 'cancelled'];
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'];

export const taskFormSchema = z
  .object({
    title: z.string().trim().min(2, 'Title must be at least 2 characters').max(200),
    status: z.enum(TASK_STATUSES),
    priority: z.enum(TASK_PRIORITIES),
    startDate: z.string().optional().or(z.literal('')),
    dueDate: z.string().optional().or(z.literal('')),
    estimatedHours: z
      .union([z.string(), z.number()])
      .optional()
      .or(z.literal(''))
      .refine((val) => val === '' || val === undefined || Number(val) >= 0, {
        message: 'Must be a positive number',
      }),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.dueDate) return true;
      return new Date(data.dueDate) >= new Date(data.startDate);
    },
    { message: 'Due date must be on or after the start date', path: ['dueDate'] }
  );

export const commentSchema = z.object({
  content: z.string().trim().min(1, 'Comment cannot be empty').max(3000),
});
