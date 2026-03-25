import express from 'express';
import { Request, Response } from 'express';
import { Op } from 'sequelize';
import User from '../models/user.model';
import RaceParticipation from '../models/raceParticipation.model';
import Race from '../models/race.model';
import { authenticate, authorize } from '../middleware/auth.middleware';
import logger from '../utils/logger';

const router = express.Router();

// Health check for user service
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'user-service',
    timestamp: new Date().toISOString()
  });
});

// Get user profile by ID (public)
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);

    if (!user) {
      res.status(404).json({
        error: {
          message: 'User not found.',
          code: 'USER_NOT_FOUND'
        }
      });
      return;
    }

    res.status(200).json({
      message: 'User profile retrieved successfully.',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    logger.error('Get user profile error', { error });
    res.status(500).json({
      error: {
        message: 'Internal server error while retrieving user profile.',
        code: 'GET_USER_ERROR'
      }
    });
  }
});

// Get user race history
router.get('/:userId/races', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = '1', limit = '20', status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await RaceParticipation.count({ where });

    // Get participations with pagination
    const participations = await RaceParticipation.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset,
      include: [
        {
          model: Race,
          as: 'race',
          attributes: ['id', 'name', 'distance', 'date', 'status', 'location', 'routeMap']
        }
      ]
    });

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      message: 'User race history retrieved successfully.',
      data: {
        participations: participations.map(p => ({
          id: p.id,
          raceId: p.raceId,
          status: p.status,
          position: p.position,
          totalTime: p.totalTime,
          distanceCovered: p.distanceCovered,
          averagePace: p.averagePace,
          startTime: p.startTime,
          endTime: p.endTime,
          race: (p as any).race ? {
            id: (p as any).race.id,
            name: (p as any).race.name,
            distance: (p as any).race.distance,
            date: (p as any).race.date,
            status: (p as any).race.status,
            location: (p as any).race.location,
            routeMap: (p as any).race.routeMap
          } : null
        })),
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
    logger.error('Get user races error', { error });
    res.status(500).json({
      error: {
        message: 'Internal server error while retrieving user races.',
        code: 'GET_USER_RACES_ERROR'
      }
    });
  }
});

// Admin-only: Get all users
router.get('/', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '50', search, role, isActive } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    
    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { username: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Get total count
    const total = await User.count({ where });

    // Get users with pagination
    const users = await User.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset,
      attributes: { exclude: ['password'] }
    });

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      message: 'Users retrieved successfully.',
      data: {
        users: users.map(user => user.toJSON()),
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
    logger.error('Get all users error', { error });
    res.status(500).json({
      error: {
        message: 'Internal server error while retrieving users.',
        code: 'GET_USERS_ERROR'
      }
    });
  }
});

// Admin-only: Update user (activate/deactivate, change role)
router.put('/:userId', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { isActive, role } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      res.status(404).json({
        error: {
          message: 'User not found.',
          code: 'USER_NOT_FOUND'
        }
      });
      return;
    }

    const updates: any = {};
    if (isActive !== undefined) updates.isActive = isActive;
    if (role && ['user', 'admin', 'moderator'].includes(role)) updates.role = role;

    await user.update(updates);

    res.status(200).json({
      message: 'User updated successfully.',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    logger.error('Update user error', { error });
    res.status(500).json({
      error: {
        message: 'Internal server error while updating user.',
        code: 'UPDATE_USER_ERROR'
      }
    });
  }
});

export default router;