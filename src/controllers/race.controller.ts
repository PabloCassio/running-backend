import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Race from '../models/race.model';
import RaceParticipation from '../models/raceParticipation.model';
import User from '../models/user.model';

interface CreateRaceRequest {
  name: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  location: string;
  distance: number;
  maxParticipants?: number;
  registrationFee?: number;
  categories?: any[];
  registrationOpen?: string;
  registrationClose?: string;
  routeMap?: string;
  rules?: string;
}

interface UpdateRaceRequest {
  name?: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  distance?: number;
  maxParticipants?: number;
  registrationFee?: number;
  categories?: any[];
  registrationOpen?: string;
  registrationClose?: string;
  routeMap?: string;
  rules?: string;
  status?: 'draft' | 'published' | 'cancelled' | 'completed';
}

/**
 * Create a new race
 */
export const createRace = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      date,
      startTime,
      endTime,
      location,
      distance,
      maxParticipants,
      registrationFee,
      categories,
      registrationOpen,
      registrationClose,
      routeMap,
      rules
    } = req.body as CreateRaceRequest;

    const organizerId = req.userId as number;

    // Validate date (must be in the future)
    const raceDate = new Date(date);
    const now = new Date();
    
    if (raceDate <= now) {
      res.status(400).json({
        error: {
          message: 'Race date must be in the future.',
          code: 'INVALID_DATE'
        }
      });
      return;
    }

    // Create race
    const race = await Race.create({
      name,
      description,
      date: raceDate,
      startTime,
      endTime,
      location,
      distance: parseFloat(distance.toString()),
      maxParticipants: maxParticipants ? parseInt(maxParticipants.toString()) : null,
      registrationFee: registrationFee ? parseFloat(registrationFee.toString()) : 0,
      categories: categories || [],
      registrationOpen: registrationOpen ? new Date(registrationOpen) : null,
      registrationClose: registrationClose ? new Date(registrationClose) : null,
      routeMap,
      rules,
      organizerId,
      status: 'draft'
    });

    res.status(201).json({
      message: 'Race created successfully.',
      data: {
        race: race.toPublicJSON()
      }
    });
  } catch (error) {
    console.error('Create race error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error while creating race.',
        code: 'CREATE_RACE_ERROR'
      }
    });
  }
};

/**
 * Get all races with filters
 */
export const getRaces = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      distance_min,
      distance_max,
      date_from,
      date_to,
      page = '1',
      limit = '20',
      search
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (distance_min || distance_max) {
      where.distance = {};
      if (distance_min) where.distance[Op.gte] = parseFloat(distance_min as string);
      if (distance_max) where.distance[Op.lte] = parseFloat(distance_max as string);
    }

    if (date_from || date_to) {
      where.date = {};
      if (date_from) where.date[Op.gte] = new Date(date_from as string);
      if (date_to) where.date[Op.lte] = new Date(date_to as string);
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { location: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Get total count
    const total = await Race.count({ where });

    // Get races with pagination
    const races = await Race.findAll({
      where,
      order: [['date', 'ASC']],
      limit: limitNum,
      offset,
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage', 'country']
        }
      ]
    });

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      message: 'Races retrieved successfully.',
      data: {
        races: races.map(race => race.toPublicJSON()),
        pagination: {
          total,
          totalPages,
          currentPage: pageNum,
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('Get races error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error while retrieving races.',
        code: 'GET_RACES_ERROR'
      }
    });
  }
};

/**
 * Get race by ID
 */
export const getRaceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { raceId } = req.params;

    const race = await Race.findByPk(raceId, {
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage', 'country', 'bio']
        },
        {
          model: RaceParticipation,
          as: 'participations',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage', 'country']
            }
          ],
          limit: 50 // Limit participants in initial fetch
        }
      ]
    });

    if (!race) {
      res.status(404).json({
        error: {
          message: 'Race not found.',
          code: 'RACE_NOT_FOUND'
        }
      });
      return;
    }

    // Check if user is registered
    let userParticipation = null;
    if (req.userId) {
      userParticipation = await RaceParticipation.findOne({
        where: {
          raceId: parseInt(raceId),
          userId: req.userId as number
        }
      });
    }

    const raceData = race.toPublicJSON() as any;
    raceData.userParticipation = userParticipation ? userParticipation.toPublicJSON() : null;

    res.status(200).json({
      message: 'Race retrieved successfully.',
      data: {
        race: raceData
      }
    });
  } catch (error) {
    console.error('Get race by ID error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error while retrieving race.',
        code: 'GET_RACE_ERROR'
      }
    });
  }
};

/**
 * Update race
 */
export const updateRace = async (req: Request, res: Response): Promise<void> => {
  try {
    const { raceId } = req.params;
    const updates = req.body as UpdateRaceRequest;

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

    // Check if user is organizer or admin
    if (race.organizerId !== req.userId && (req as any).user?.role !== 'admin') {
      res.status(403).json({
        error: {
          message: 'Only the organizer or admin can update this race.',
          code: 'NOT_AUTHORIZED'
        }
      });
      return;
    }

    // Prevent updates if race is not in draft status
    if (race.status !== 'draft') {
      res.status(400).json({
        error: {
          message: 'Cannot update a race that is not in draft status.',
          code: 'RACE_NOT_DRAFT'
        }
      });
      return;
    }

    // Validate date if being updated
    if (updates.date) {
      const newDate = new Date(updates.date);
      const now = new Date();
      
      if (newDate <= now) {
        res.status(400).json({
          error: {
            message: 'Race date must be in the future.',
            code: 'INVALID_DATE'
          }
        });
        return;
      }
    }

    // Update race
    await race.update(updates);

    // Refresh race data
    await race.reload();

    res.status(200).json({
      message: 'Race updated successfully.',
      data: {
        race: race.toPublicJSON()
      }
    });
  } catch (error) {
    console.error('Update race error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error while updating race.',
        code: 'UPDATE_RACE_ERROR'
      }
    });
  }
};

/**
 * Delete race
 */
export const deleteRace = async (req: Request, res: Response): Promise<void> => {
  try {
    const { raceId } = req.params;

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

    // Check if user is organizer or admin
    if (race.organizerId !== req.userId && (req as any).user?.role !== 'admin') {
      res.status(403).json({
        error: {
          message: 'Only the organizer or admin can delete this race.',
          code: 'NOT_AUTHORIZED'
        }
      });
      return;
    }

    // Prevent deletion if race is not in draft status
    if (race.status !== 'draft') {
      res.status(400).json({
        error: {
          message: 'Cannot delete a race that is not in draft status.',
          code: 'RACE_NOT_DRAFT'
        }
      });
      return;
    }

    // Prevent deletion if race has participants
    if (race.currentParticipants > 0) {
      res.status(400).json({
        error: {
          message: 'Cannot delete a race that has participants.',
          code: 'RACE_HAS_PARTICIPANTS'
        }
      });
      return;
    }

    await race.destroy();

    res.status(200).json({
      message: 'Race deleted successfully.'
    });
  } catch (error) {
    console.error('Delete race error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error while deleting race.',
        code: 'DELETE_RACE_ERROR'
      }
    });
  }
};

/**
 * Register for a race
 */
export const registerForRace = async (req: Request, res: Response): Promise<void> => {
  try {
    const { raceId } = req.params;
    const userId = req.userId as number;

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

    // Check if race is open for registration
    if (!race.canJoin()) {
      res.status(400).json({
        error: {
          message: 'Race is not open for registration.',
          code: 'REGISTRATION_CLOSED'
        }
      });
      return;
    }

    // Check if race is full
    if (race.isFull()) {
      res.status(400).json({
        error: {
          message: 'Race is full.',
          code: 'RACE_FULL'
        }
      });
      return;
    }

    // Check if user is already registered
    const existingParticipation = await RaceParticipation.findOne({
      where: {
        raceId: parseInt(raceId),
        userId
      }
    });

    if (existingParticipation) {
      res.status(409).json({
        error: {
          message: 'You are already registered for this race.',
          code: 'ALREADY_REGISTERED'
        }
      });
      return;
    }

    // Create participation
    const participation = await RaceParticipation.create({
      raceId: parseInt(raceId),
      userId,
      status: 'registered'
    });

    // Update race participant count
    await race.update({
      currentParticipants: race.currentParticipants + 1
    });

    res.status(201).json({
      message: 'Successfully registered for the race.',
      data: {
        participation: participation.toPublicJSON()
      }
    });
  } catch (error) {
    console.error('Register for race error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error while registering for race.',
        code: 'REGISTER_RACE_ERROR'
      }
    });
  }
};

/**
 * Unregister from a race
 */
export const unregisterFromRace = async (req: Request, res: Response): Promise<void> => {
  try {
    const { raceId } = req.params;
    const userId = req.userId as number;

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

    // Check if race registration is still open
    const now = new Date();
    const registrationClose = race.registrationClose ? new Date(race.registrationClose) : null;
    if (registrationClose && now > registrationClose) {
      res.status(400).json({
        error: {
          message: 'Cannot unregister after registration has closed.',
          code: 'REGISTRATION_CLOSED'
        }
      });
      return;
    }

    // Find participation
    const participation = await RaceParticipation.findOne({
      where: {
        raceId: parseInt(raceId),
        userId
      }
    });

    if (!participation) {
      res.status(404).json({
        error: {
          message: 'You are not registered for this race.',
          code: 'NOT_REGISTERED'
        }
      });
      return;
    }

    // Delete participation
    await participation.destroy();

    // Update race participant count
    await race.update({
      currentParticipants: Math.max(0, race.currentParticipants - 1)
    });

    res.status(200).json({
      message: 'Successfully unregistered from the race.'
    });
  } catch (error) {
    console.error('Unregister from race error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error while unregistering from race.',
        code: 'UNREGISTER_RACE_ERROR'
      }
    });
  }
};

/**
 * Get race participants
 */
export const getRaceParticipants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { raceId } = req.params;
    const { status, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

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

    // Build where clause
    const where: any = { raceId: parseInt(raceId) };
    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await RaceParticipation.count({ where });

    // Get participants with pagination
    const participants = await RaceParticipation.findAll({
      where,
      order: [
        ['position', 'ASC NULLS LAST'],
        ['totalTime', 'ASC NULLS LAST'],
        ['createdAt', 'ASC']
      ],
      limit: limitNum,
      offset,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'profileImage', 'country']
        }
      ]
    });

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      message: 'Race participants retrieved successfully.',
      data: {
        participants: participants.map(p => p.toPublicJSON()),
        pagination: {
          total,
          totalPages,
          currentPage: pageNum,
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('Get race participants error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error while retrieving race participants.',
        code: 'GET_PARTICIPANTS_ERROR'
      }
    });
  }
};

/**
 * Start a race (for participants)
 */
export const startRace = async (req: Request, res: Response): Promise<void> => {
  try {
    const { raceId } = req.params;
    const userId = req.userId as number;

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

    // Check if race is active (published and date has arrived)
    const now = new Date();
    const raceDate = new Date(race.date);
    
    if (race.status !== 'published' || now < raceDate) {
      res.status(400).json({
        error: {
          message: 'Race is not active yet.',
          code: 'RACE_NOT_ACTIVE'
        }
      });
      return;
    }

    // Find participation
    const participation = await RaceParticipation.findOne({
      where: {
        raceId: parseInt(raceId),
        userId,
        status: 'registered'
      }
    });

    if (!participation) {
      res.status(404).json({
        error: {
          message: 'You are not registered for this race or have already started.',
          code: 'NOT_REGISTERED'
        }
      });
      return;
    }

    // Update participation status
    await participation.update({
      status: 'started',
      startTime: new Date()
    });

    res.status(200).json({
      message: 'Race started successfully.',
      data: {
        participation: participation.toPublicJSON()
      }
    });
  } catch (error) {
    console.error('Start race error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error while starting race.',
        code: 'START_RACE_ERROR'
      }
    });
  }
};

/**
 * Publish a race (organizer only)
 */
export const publishRace = async (req: Request, res: Response): Promise<void> => {
  try {
    const { raceId } = req.params;

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

    // Check if user is organizer or admin
    if (race.organizerId !== req.userId && (req as any).user?.role !== 'admin') {
      res.status(403).json({
        error: {
          message: 'Only the organizer or admin can publish this race.',
          code: 'NOT_AUTHORIZED'
        }
      });
      return;
    }

    // Check if race is in draft status
    if (race.status !== 'draft') {
      res.status(400).json({
        error: {
          message: 'Only draft races can be published.',
          code: 'NOT_DRAFT'
        }
      });
      return;
    }

    // Validate race has required fields
    if (!race.date || !race.location || !race.distance) {
      res.status(400).json({
        error: {
          message: 'Race must have date, location, and distance set before publishing.',
          code: 'INCOMPLETE_RACE'
        }
      });
      return;
    }

    // Update race status
    await race.update({
      status: 'published'
    });

    res.status(200).json({
      message: 'Race published successfully.',
      data: {
        race: race.toPublicJSON()
      }
    });
  } catch (error) {
    console.error('Publish race error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error while publishing race.',
        code: 'PUBLISH_RACE_ERROR'
      }
    });
  }
};

/**
 * Cancel a race (organizer only)
 */
export const cancelRace = async (req: Request, res: Response): Promise<void> => {
  try {
    const { raceId } = req.params;
    const { reason } = req.body;

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

    // Check if user is organizer or admin
    if (race.organizerId !== req.userId && (req as any).user?.role !== 'admin') {
      res.status(403).json({
        error: {
          message: 'Only the organizer or admin can cancel this race.',
          code: 'NOT_AUTHORIZED'
        }
      });
      return;
    }

    // Check if race can be cancelled
    if (race.status === 'cancelled' || race.status === 'completed') {
      res.status(400).json({
        error: {
          message: `Race is already ${race.status}.`,
          code: 'RACE_ALREADY_FINALIZED'
        }
      });
      return;
    }

    // Update race status
    await race.update({
      status: 'cancelled',
      cancellationReason: reason
    });

    // Notify participants (in a real app, this would send notifications)
    // For now, we just update the status

    res.status(200).json({
      message: 'Race cancelled successfully.',
      data: {
        race: race.toPublicJSON()
      }
    });
  } catch (error) {
    console.error('Cancel race error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error while cancelling race.',
        code: 'CANCEL_RACE_ERROR'
      }
    });
  }
};

/**
 * Complete a race (organizer only)
 */
export const completeRace = async (req: Request, res: Response): Promise<void> => {
  try {
    const { raceId } = req.params;

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

    // Check if user is organizer or admin
    if (race.organizerId !== req.userId && (req as any).user?.role !== 'admin') {
      res.status(403).json({
        error: {
          message: 'Only the organizer or admin can complete this race.',
          code: 'NOT_AUTHORIZED'
        }
      });
      return;
    }

    // Check if race can be completed
    if (race.status !== 'published') {
      res.status(400).json({
        error: {
          message: 'Only published races can be completed.',
          code: 'NOT_PUBLISHED'
        }
      });
      return;
    }

    // Check if race date has passed
    const now = new Date();
    const raceDate = new Date(race.date);
    if (now < raceDate) {
      res.status(400).json({
        error: {
          message: 'Race date has not arrived yet.',
          code: 'RACE_NOT_OVER'
        }
      });
      return;
    }

    // Update race status
    await race.update({
      status: 'completed'
    });

    res.status(200).json({
      message: 'Race completed successfully.',
      data: {
        race: race.toPublicJSON()
      }
    });
  } catch (error) {
    console.error('Complete race error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error while completing race.',
        code: 'COMPLETE_RACE_ERROR'
      }
    });
  }
};
