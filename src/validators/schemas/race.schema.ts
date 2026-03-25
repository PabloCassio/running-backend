import { z } from 'zod';

export const createRaceSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, 'Race name must be at least 3 characters')
      .max(100, 'Race name cannot exceed 100 characters'),
    
    description: z
      .string()
      .max(1000, 'Description cannot exceed 1000 characters')
      .optional(),
    
    date: z
      .string()
      .datetime('Invalid date format')
      .or(z.date()),
    
    location: z
      .string()
      .min(3, 'Location must be at least 3 characters')
      .max(200, 'Location cannot exceed 200 characters'),
    
    distance: z
      .number()
      .positive('Distance must be a positive number')
      .or(z.string().transform((val) => parseFloat(val))),
    
    maxParticipants: z
      .number()
      .int('Max participants must be an integer')
      .positive('Max participants must be positive')
      .optional()
      .or(z.string().transform((val) => parseInt(val, 10)).optional()),
    
    registrationDeadline: z
      .string()
      .datetime('Invalid registration deadline format')
      .or(z.date())
      .optional(),
    
    status: z
      .enum(['upcoming', 'ongoing', 'completed', 'cancelled'])
      .default('upcoming')
      .optional(),
  }),
});

export const updateRaceSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, 'Race name must be at least 3 characters')
      .max(100, 'Race name cannot exceed 100 characters')
      .optional(),
    
    description: z
      .string()
      .max(1000, 'Description cannot exceed 1000 characters')
      .optional(),
    
    date: z
      .string()
      .datetime('Invalid date format')
      .or(z.date())
      .optional(),
    
    location: z
      .string()
      .min(3, 'Location must be at least 3 characters')
      .max(200, 'Location cannot exceed 200 characters')
      .optional(),
    
    distance: z
      .number()
      .positive('Distance must be a positive number')
      .or(z.string().transform((val) => parseFloat(val)))
      .optional(),
    
    maxParticipants: z
      .number()
      .int('Max participants must be an integer')
      .positive('Max participants must be positive')
      .or(z.string().transform((val) => parseInt(val, 10)))
      .optional(),
    
    registrationDeadline: z
      .string()
      .datetime('Invalid registration deadline format')
      .or(z.date())
      .optional(),
    
    status: z
      .enum(['upcoming', 'ongoing', 'completed', 'cancelled'])
      .optional(),
  }),
  params: z.object({
    id: z
      .string()
      .regex(/^\d+$/, 'Race ID must be a number')
      .transform((val) => parseInt(val, 10)),
  }),
});

export const getRaceSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^\d+$/, 'Race ID must be a number')
      .transform((val) => parseInt(val, 10)),
  }),
});

export const deleteRaceSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^\d+$/, 'Race ID must be a number')
      .transform((val) => parseInt(val, 10)),
  }),
});

export const listRacesSchema = z.object({
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
    
    status: z
      .enum(['upcoming', 'ongoing', 'completed', 'cancelled'])
      .optional(),
    
    search: z
      .string()
      .max(100, 'Search query cannot exceed 100 characters')
      .optional(),
  }).optional(),
});

export const registerForRaceSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^\d+$/, 'Race ID must be a number')
      .transform((val) => parseInt(val, 10)),
  }),
  body: z.object({
    emergencyContact: z
      .string()
      .max(200, 'Emergency contact cannot exceed 200 characters')
      .optional(),
    
    medicalInfo: z
      .string()
      .max(500, 'Medical info cannot exceed 500 characters')
      .optional(),
  }).optional(),
});

export type CreateRaceInput = z.infer<typeof createRaceSchema>;
export type UpdateRaceInput = z.infer<typeof updateRaceSchema>;
export type GetRaceInput = z.infer<typeof getRaceSchema>;
export type DeleteRaceInput = z.infer<typeof deleteRaceSchema>;
export type ListRacesInput = z.infer<typeof listRacesSchema>;
export type RegisterForRaceInput = z.infer<typeof registerForRaceSchema>;

export const raceIdParamSchema = z.object({
  params: z.object({
    raceId: z.string().regex(/^\d+$/, 'Race ID must be a valid integer'),
  }),
});

export const createRaceBodySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Race name is required')
      .max(100, 'Race name cannot exceed 100 characters'),
    description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
    date: z.string().min(1, 'Race date is required'),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    location: z
      .string()
      .min(1, 'Location is required')
      .max(200, 'Location cannot exceed 200 characters'),
    distance: z
      .number()
      .positive('Distance must be a positive number')
      .or(z.string().transform((val) => parseFloat(val))),
    maxParticipants: z
      .number()
      .int()
      .positive()
      .or(z.string().transform((val) => parseInt(val, 10)))
      .optional(),
    registrationFee: z
      .number()
      .min(0)
      .or(z.string().transform((val) => parseFloat(val)))
      .optional(),
    categories: z.array(z.any()).optional(),
    registrationOpen: z.string().optional(),
    registrationClose: z.string().optional(),
    routeMap: z.string().optional(),
    rules: z.string().optional(),
  }),
});

export const updateRaceBodySchema = z.object({
  params: z.object({
    raceId: z.string().regex(/^\d+$/, 'Race ID must be a valid integer'),
  }),
  body: z
    .object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(1000).optional(),
      date: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      location: z.string().min(1).max(200).optional(),
      distance: z.number().positive().optional(),
      maxParticipants: z.number().int().positive().optional(),
      registrationFee: z.number().min(0).optional(),
      categories: z.array(z.any()).optional(),
      registrationOpen: z.string().optional(),
      registrationClose: z.string().optional(),
      routeMap: z.string().optional(),
      rules: z.string().optional(),
      status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional(),
    })
    .optional(),
});

export const listRacesQuerySchema = z.object({
  query: z
    .object({
      status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional(),
      distance_min: z.string().optional(),
      distance_max: z.string().optional(),
      date_from: z.string().optional(),
      date_to: z.string().optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
      search: z.string().max(100).optional(),
    })
    .optional(),
});

export const participantsQuerySchema = z.object({
  params: z.object({
    raceId: z.string().regex(/^\d+$/, 'Race ID must be a valid integer'),
  }),
  query: z
    .object({
      status: z
        .enum(['registered', 'started', 'completed', 'dnf', 'disqualified'])
        .optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    })
    .optional(),
});
