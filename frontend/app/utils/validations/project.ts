import * as z from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(1, 'Project title is required').max(100, 'Title too long'),
  description: z.string().optional(),
  deadline: z.string().optional(),
  templateType: z.enum(['default', 'minimal', 'custom']),
});

export type CreateProjectFormData = z.infer<typeof createProjectSchema>;

export const boardSettingsSchema = z.object({
  title: z.string().min(1, 'Project title is required'),
  description: z.string().optional(),
  deadline: z.string().optional(),
});

export type BoardSettingsFormData = z.infer<typeof boardSettingsSchema>;
