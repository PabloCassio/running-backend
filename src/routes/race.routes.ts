import express from 'express';
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
  completeRace,
} from '../controllers/race.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createRaceBodySchema,
  updateRaceBodySchema,
  raceIdParamSchema,
  listRacesQuerySchema,
  participantsQuerySchema,
} from '../validators/schemas/race.schema';
import Race from '../models/race.model';
import RaceParticipation from '../models/raceParticipation.model';
import logger from '../utils/logger';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', validate(listRacesQuerySchema), getRaces);
router.get('/:raceId', validate(raceIdParamSchema), getRaceById);
router.get('/:raceId/participants', validate(participantsQuerySchema), getRaceParticipants);

// Protected routes (require authentication)
router.post('/', authenticate, validate(createRaceBodySchema), createRace);
router.put('/:raceId', authenticate, validate(updateRaceBodySchema), updateRace);
router.delete('/:raceId', authenticate, validate(raceIdParamSchema), deleteRace);
router.post('/:raceId/register', authenticate, validate(raceIdParamSchema), registerForRace);
router.delete('/:raceId/unregister', authenticate, validate(raceIdParamSchema), unregisterFromRace);
router.post('/:raceId/start', authenticate, validate(raceIdParamSchema), startRace);

// Race management routes (organizer/admin only)
router.post('/:raceId/publish', authenticate, validate(raceIdParamSchema), publishRace);
router.post('/:raceId/cancel', authenticate, validate(raceIdParamSchema), cancelRace);
router.post('/:raceId/complete', authenticate, validate(raceIdParamSchema), completeRace);

// Admin-only: force status update
router.put('/:raceId/status', authenticate, authorize('admin'), validate(raceIdParamSchema), async (req, res) => {
  try {
    const { raceId } = req.params;
    const { status } = req.body;

    if (!['draft', 'published', 'cancelled', 'completed'].includes(status)) {
      res.status(400).json({
        error: {
          message: 'Invalid status. Must be one of: draft, published, cancelled, completed.',
          code: 'INVALID_STATUS',
        },
      });
      return;
    }

    const race = await Race.findByPk(raceId);

    if (!race) {
      res.status(404).json({
        error: {
          message: 'Race not found.',
          code: 'RACE_NOT_FOUND',
        },
      });
      return;
    }

    await race.update({ status });

    if (status === 'published') {
      await RaceParticipation.update(
        { status: 'registered' },
        {
          where: {
            raceId: parseInt(raceId),
            status: 'pending' as any,
          },
        },
      );
    }

    res.status(200).json({
      message: `Race status updated to ${status}.`,
      data: {
        race: race.toPublicJSON(),
      },
    });
  } catch (error) {
    logger.error('Update race status error', { error });
    res.status(500).json({
      error: {
        message: 'Internal server error while updating race status.',
        code: 'UPDATE_STATUS_ERROR',
      },
    });
  }
});

// Health check for race service
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'race-service',
    timestamp: new Date().toISOString(),
  });
});

export default router;
