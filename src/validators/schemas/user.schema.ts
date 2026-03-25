import { z } from 'zod';

export const getUserSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^\d+$/, 'User ID must be a number')
      .transform((val) => parseInt(val, 10)),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^\d+$/, 'User ID must be a number')
      .transform((val) => parseInt(val, 10)),
  }),
  body: z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username cannot exceed 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores')
      .optional(),
    
    email: z
      .string()
      .email('Please provide a valid email address')
      .toLowerCase()
      .optional(),
    
    firstName: z
      .string()
      .max(50, 'First name cannot exceed 50 characters')
      .optional(),
    
    lastName: z
      .string()
      .max(50, 'Last name cannot exceed 50 characters')
      .optional(),
    
    bio: z
      .string()
      .max(500, 'Bio cannot exceed 500 characters')
      .optional(),
    
    role: z
      .enum(['user', 'admin', 'organizer'])
      .optional(),
    
    isActive: z
      .boolean()
      .optional(),
  }),
});

export const deleteUserSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^\d+$/, 'User ID must be a number')
      .transform((val) => parseInt(val, 10)),
  }),
});

export const listUsersSchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a number')
      .transform((val) => parseInt(val, 10))
      .default('1')
      .optional(),
    
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a number')
      .transform((val) => parseInt(val, 10))
      .default('10')
      .optional(),
    
    role: z
      .enum(['user', 'admin', 'organizer'])
      .optional(),
    
    isActive: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    
    search: z
      .string()
      .max(100, 'Search query cannot exceed 100 characters')
      .optional(),
  }).optional(),
});

export type GetUserInput = z.infer<typeof getUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;
export type ListUsersInput = z.infer<typeof listUsersSchema>;
