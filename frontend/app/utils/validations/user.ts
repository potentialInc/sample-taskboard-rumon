import * as z from 'zod';

export const editProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  jobTitle: z.string().optional(),
  bio: z.string().max(500, 'Bio must be under 500 characters').optional(),
  phone: z.string().optional(),
  timezone: z.string().optional(),
});

export type EditProfileFormData = z.infer<typeof editProfileSchema>;

export const createUserSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['user', 'admin']),
  jobTitle: z.string().optional(),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
