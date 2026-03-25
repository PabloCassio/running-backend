import { body, query, param } from 'express-validator';

export const createRaceValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Race name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Race name must be between 3 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),

  body('date')
    .notEmpty()
    .withMessage('Race date is required')
    .isISO8601()
    .withMessage('Please provide a valid date in ISO format (YYYY-MM-DD)')
    .custom((value) => {
      const raceDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return raceDate >= today;
    })
    .withMessage('Race date must be today or in the future'),

  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters'),

  body('distance')
    .notEmpty()
    .withMessage('Distance is required')
    .isFloat({ min: 0.1 })
    .withMessage('Distance must be a positive number')
    .toFloat(),

  body('maxParticipants')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum participants must be a positive integer')
    .toInt(),

  body('registrationFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Registration fee must be a non-negative number')
    .toFloat(),

  body('categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array'),
];

export const updateRaceValidator = [
  param('id')
    .notEmpty()
    .withMessage('Race ID is required')
    .isInt()
    .withMessage('Race ID must be an integer')
    .toInt(),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Race name must be between 3 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date in ISO format (YYYY-MM-DD)')
    .custom((value) => {
      const raceDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return raceDate >= today;
    })
    .withMessage('Race date must be today or in the future'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters'),

  body('distance')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Distance must be a positive number')
    .toFloat(),

  body('maxParticipants')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum participants must be a positive integer')
    .toInt(),

  body('registrationFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Registration fee must be a non-negative number')
    .toFloat(),

  body('categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array'),

  body('status')
    .optional()
    .isIn(['draft', 'published', 'ongoing', 'completed', 'cancelled'])
    .withMessage('Invalid race status'),
];

export const raceQueryValidator = [
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

  query('status')
    .optional()
    .isIn(['draft', 'published', 'ongoing', 'completed', 'cancelled', 'all'])
    .withMessage('Invalid status filter'),

  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for dateFrom'),

  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for dateTo')
    .custom((value, { req }) => {
      if (req.query.dateFrom && value) {
        const fromDate = new Date(req.query.dateFrom as string);
        const toDate = new Date(value);
        return toDate >= fromDate;
      }
      return true;
    })
    .withMessage('dateTo must be after or equal to dateFrom'),

  query('distanceMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum distance must be a non-negative number')
    .toFloat(),

  query('distanceMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum distance must be a non-negative number')
    .toFloat()
    .custom((value, { req }) => {
      if (req.query.distanceMin && value) {
        const min = parseFloat(req.query.distanceMin as string);
        return value >= min;
      }
      return true;
    })
    .withMessage('Maximum distance must be greater than or equal to minimum distance'),
];

export const raceIdValidator = [
  param('id')
    .notEmpty()
    .withMessage('Race ID is required')
    .isInt()
    .withMessage('Race ID must be an integer')
    .toInt(),
];

export const raceParticipationValidator = [
  param('raceId')
    .notEmpty()
    .withMessage('Race ID is required')
    .isInt()
    .withMessage('Race ID must be an integer')
    .toInt(),

  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters'),

  body('bibNumber')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Bib number cannot exceed 20 characters'),

  body('estimatedTime')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid estimated time in ISO format'),
];