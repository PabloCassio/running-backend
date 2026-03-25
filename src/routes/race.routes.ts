import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createRace,
  getRaces,
  getRaceById,
  updateRace,
  deleteRace,
  registerForRace,
  unregisterFromRace,
  getRaceParticipants,
  startRace,
  publishRace,
  cancelRace,
  completeRace
} from '../controllers/race.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import Race from '../models/race.model';
import RaceParticipation from '../models/raceParticipation.model';

const router = express.Router();

// Validation middleware
const createRaceValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Race name is required.')
    .isLength({ max: 100 })
    .withMessage('Race name cannot exceed 100 characters.'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters.'),
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date.')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      return date > now;
    })
    .withMessage('Race date must be in the future.'),
  body('startTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Start time must be in HH:MM format (24-hour).'),
  body('endTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('End time must be in HH:MM format (24-hour).'),
  body('location')
    .notEmpty()
    .withMessage('Location is required.')
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters.'),
  body('distance')
    .isFloat({ min: 0.1 })
    .withMessage('Distance must be a positive number (in kilometers).'),
  body('maxParticipants')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum participants must be a positive integer.'),
  body('registrationFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Registration fee must be a non-negative number.'),
  body('categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array.'),
  body('registrationOpen')
    .optional()
    .isISO8601()
    .withMessage('Registration open date must be a valid ISO 8601 date.'),
  body('registrationClose')
    .optional()
    .isISO8601()
    .withMessage('Registration close date must be a valid ISO 8601 date.'),
  body('routeMap')
    .optional()
    .isURL()
    .withMessage('Route map must be a valid URL.'),
  body('rules')
    .optional()
    .isString()
    .withMessage('Rules must be a string.')
];

const updateRaceValidation = [
  param('raceId')
    .isInt()
    .withMessage('Race ID must be a valid integer.'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Race name cannot be empty.')
    .isLength({ max: 100 })
    .withMessage('Race name cannot exceed 100 characters.'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters.'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO 8601 date.')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      return date > now;
    })
    .withMessage('Race date must be in the future.'),
  body('startTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Start time must be in HH:MM format (24-hour).'),
  body('endTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('End time must be in HH:MM format (24-hour).'),
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location cannot exceed 200 characters.'),
  body('distance')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Distance must be a positive number (in kilometers).'),
  body('maxParticipants')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum participants must be a positive integer.'),
  body('registrationFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Registration fee must be a non-negative number.'),
  body('categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array.'),
  body('registrationOpen')
    .optional()
    .isISO8601()
    .withMessage('Registration open date must be a valid ISO 8601 date.'),
  body('registrationClose')
    .optional()
    .isISO8601()
    .withMessage('Registration close date must be a valid ISO 8601 date.'),
  body('routeMap')
    .optional()
    .isURL()
    .withMessage('Route map must be a valid URL.'),
  body('rules')
    .optional()
    .isString()
    .withMessage('Rules must be a string.'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'cancelled', 'completed'])
    .withMessage('Status must be one of: draft, published, cancelled, completed.')
];

const raceIdValidation = [
  param('raceId')
    .isInt()
    .withMessage('Race ID must be a valid integer.')
];

const queryValidation = [
  query('status')
    .optional()
    .isIn(['draft', 'published', 'cancelled', 'completed'])
    .withMessage('Status must be one of: draft, published, cancelled, completed.'),
  query('distance_min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum distance must be a non-negative number.'),
  query('distance_max')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum distance must be a non-negative number.'),
  query('date_from')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid ISO 8601 date.'),
  query('date_to')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid ISO 8601 date.'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer.'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100.'),
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search query cannot exceed 100 characters.')
];

const participantsQueryValidation = [
  query('status')
    .optional()
    .isIn(['registered', 'started', 'completed', 'dnf', 'disqualified'])
    .withMessage('Status must be one of: registered, started, completed, dnf, disqualified.'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer.'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100.')
];

// Public routes (no authentication required)
router.get('/', queryValidation, getRaces);
router.get('/:raceId', raceIdValidation, getRaceById);
router.get('/:raceId/participants', raceIdValidation, participantsQueryValidation, getRaceParticipants);

// Protected routes (require authentication)
router.post('/', authenticate, createRaceValidation, createRace);
router.put('/:raceId', authenticate, updateRaceValidation, updateRace);
router.delete('/:raceId', authenticate, raceIdValidation, deleteRace);
router.post('/:raceId/register', authenticate, raceIdValidation, registerForRace);
router.delete('/:raceId/unregister', authenticate, raceIdValidation, unregisterFromRace);
router.post('/:raceId/start', authenticate, raceIdValidation, startRace);

// Race management routes (organizer/admin only)
router.post('/:raceId/publish', authenticate, raceIdValidation, publishRace);
router.post('/:raceId/cancel', authenticate, raceIdValidation, cancelRace);
router.post('/:raceId/complete', authenticate, raceIdValidation, completeRace);

// Admin-only routes
router.put('/:raceId/status', authenticate, authorize('admin'), raceIdValidation, async (req, res) => {
  try {
    const { raceId } = req.params;
    const { status } = req.body;

    if (!['draft', 'published', 'cancelled', 'completed'].includes(status)) {
      res.status(400).json({
        error: {
          message: 'Invalid status. Must be one of: draft, published, cancelled, completed.',
          code: 'INVALID_STATUS'
        }
      });
      return;
    }

    const race = await Race.findByPk(raceId);

    if (!race) {
      res.status(404).json({
        error: {
          message: 'Race not found.',
          code: 'RACE_NOT_FOUND'
        }
      });
      return;
    }

    await race.update({ status });

    // If race is being marked as published, update all registered participants
    if (status === 'published') {
      await RaceParticipation.update(
        { status: 'registered' },
        {
          where: {
            raceId: parseInt(raceId),
            status: 'pending'
          }
        }
      );
    }

    res.status(200).json({
      message: `Race status updated to ${status}.`,
      data: {
        race: race.toPublicJSON()
      }
    });
  } catch (error) {
    console.error('Update race status error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error while updating race status.',
        code: 'UPDATE_STATUS_ERROR'
      }
    });
  }
});

// Health check for race service
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'race-service',
    timestamp: new Date().toISOString()
  });
});

export default router;
