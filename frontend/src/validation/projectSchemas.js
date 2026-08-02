import { z } from 'zod';

export const PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'completed', 'archived'];
export const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export const projectFormSchema = z
  .object({
    name: z.string().trim().min(3, 'Name must be at least 3 characters').max(150),
    description: z.string().trim().max(2000).optional().or(z.literal('')),
    status: z.enum(PROJECT_STATUSES),
    priority: z.enum(PRIORITIES),
    startDate: z.string().optional().or(z.literal('')),
    dueDate: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.dueDate) return true;
      return new Date(data.dueDate) >= new Date(data.startDate);
    },
    { message: 'Due date must be on or after the start date', path: ['dueDate'] }
  );
