import { body, query, param } from 'express-validator';

export const userQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query cannot exceed 100 characters'),

  query('role')
    .optional()
    .isIn(['user', 'admin', 'organizer'])
    .withMessage('Invalid role filter'),

  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
    .toBoolean(),
];

export const userIdValidator = [
  param('id')
    .notEmpty()
    .withMessage('User ID is required')
    .isInt()
    .withMessage('User ID must be an integer')
    .toInt(),
];

export const updateUserValidator = [
  param('id')
    .notEmpty()
    .withMessage('User ID is required')
    .isInt()
    .withMessage('User ID must be an integer')
    .toInt(),

  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers and underscores'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),

  body('role')
    .optional()
    .isIn(['user', 'admin', 'organizer'])
    .withMessage('Invalid role'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
    .toBoolean(),
];

export const userStatsValidator = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (req.query.startDate && value) {
        const startDate = new Date(req.query.startDate as string);
        const endDate = new Date(value);
        return endDate >= startDate;
      }
      return true;
    })
    .withMessage('End date must be after or equal to start date'),
];

export const userExportValidator = [
  query('format')
    .optional()
    .isIn(['csv', 'json'])
    .withMessage('Format must be either csv or json'),

  query('fields')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        const fields = value.split(',');
        const allowedFields = ['id', 'username', 'email', 'firstName', 'lastName', 'role', 'createdAt'];
        return fields.every(field => allowedFields.includes(field.trim()));
      }
      return true;
    })
    .withMessage('Invalid fields requested'),
];