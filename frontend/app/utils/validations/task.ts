import * as z from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});

export type CreateTaskFormData = z.infer<typeof createTaskSchema>;
