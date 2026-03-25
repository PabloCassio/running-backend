import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import logger from '../utils/logger';

interface JwtPayload {
  userId: string;
  iat: number;
  jti: string;
}

interface RefreshTokenPayload extends JwtPayload {
  type: 'refresh';
}

/**
 * Middleware to verify JWT token
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: {
          message: 'Access denied. No token provided.',
          code: 'NO_TOKEN'
        }
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    // Find user
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.isActive) {
      res.status(401).json({
        error: {
          message: 'User not found or account is inactive.',
          code: 'USER_NOT_FOUND'
        }
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
    };
    req.userId = user.id;
    
    // Update last login (non-blocking)
    user.update({ lastLogin: new Date() }).catch((err) => 
      logger.error('Failed to update last login', { error: err })
    );
    
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        error: {
          message: 'Invalid token.',
          code: 'INVALID_TOKEN'
        }
      });
      return;
    }
    
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        error: {
          message: 'Token has expired.',
          code: 'TOKEN_EXPIRED'
        }
      });
      return;
    }
    
    logger.error('Authentication error', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: {
        message: 'Internal server error during authentication.',
        code: 'AUTH_ERROR'
      }
    });
  }
};

/**
 * Middleware to check if user has required role
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    
    if (!user) {
      res.status(401).json({
        error: {
          message: 'Authentication required.',
          code: 'AUTH_REQUIRED'
        }
      });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({
        error: {
          message: 'Insufficient permissions.',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: roles,
          userRole: user.role
        }
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user is the owner of a resource
 */
export const isOwner = (resourceOwnerIdField = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    
    if (!user) {
      res.status(401).json({
        error: {
          message: 'Authentication required.',
          code: 'AUTH_REQUIRED'
        }
      });
      return;
    }

    // Get resource owner ID from request params or body
    const resourceOwnerId = req.params[resourceOwnerIdField] || (req.body as any)[resourceOwnerIdField];
    
    if (!resourceOwnerId) {
      res.status(400).json({
        error: {
          message: 'Resource owner ID not specified.',
          code: 'NO_OWNER_ID'
        }
      });
      return;
    }

    // Check if user is admin or owner
    if (user.role !== 'admin' && user.id !== resourceOwnerId) {
      res.status(403).json({
        error: {
          message: 'You can only access your own resources.',
          code: 'NOT_OWNER'
        }
      });
      return;
    }

    next();
  };
};

/**
 * Generate JWT token
 */
export const generateToken = (userId: string, expiresIn: string | number = process.env.JWT_EXPIRES_IN || '1h'): string => {
  return jwt.sign(
    { userId, iat: Math.floor(Date.now() / 1000), jti: Math.random().toString(36).substring(2) },
    process.env.JWT_SECRET!,
    { expiresIn: expiresIn as any }
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId, type: 'refresh', iat: Math.floor(Date.now() / 1000), jti: Math.random().toString(36).substring(2) },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN as any || '7d' }
  );
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload | null => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as RefreshTokenPayload;
  } catch (error) {
    return null;
  }
};