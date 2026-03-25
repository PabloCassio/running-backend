import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { Request, Response } from 'express';
import User from '../models/user.model';
import { 
  generateToken, 
  generateRefreshToken, 
  verifyRefreshToken 
} from '../middleware/auth.middleware';
import logger from '../utils/logger';

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  birthDate?: string;
  country?: string;
  city?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  username?: string;
  birthDate?: string;
  country?: string;
  city?: string;
  bio?: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        }
      });
      return;
    }

    const { email, password, firstName, lastName, username, birthDate, country, city } = req.body as RegisterRequest;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        email
      }
    });

    if (existingUser) {
      res.status(409).json({
        error: {
          message: 'User with this email already exists.',
          code: 'EMAIL_EXISTS'
        }
      });
      return;
    }

    // Check if username is taken
    const existingUsername = await User.findOne({
      where: {
        username
      }
    });

    if (existingUsername) {
      res.status(409).json({
        error: {
          message: 'Username is already taken.',
          code: 'USERNAME_EXISTS'
        }
      });
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      username,
      birthDate: birthDate ? new Date(birthDate) : null,
      country: country || null,
      city: city || null,
      isActive: true
    });

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Return user data without password
    const userData = user.toJSON();

    res.status(201).json({
      message: 'User registered successfully.',
      data: {
        user: userData,
        token,
        refreshToken
      }
    });
  } catch (error: any) {
    logger.error('Registration error', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: {
        message: 'Internal server error during registration.',
        code: 'REGISTRATION_ERROR'
      }
    });
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        }
      });
      return;
    }

    const { email, password } = req.body as LoginRequest;

    // Find user
    const user = await User.findOne({
      where: {
        email
      }
    });

    if (!user) {
      res.status(401).json({
        error: {
          message: 'Invalid email or password.',
          code: 'INVALID_CREDENTIALS'
        }
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(403).json({
        error: {
          message: 'Account is deactivated. Please contact support.',
          code: 'ACCOUNT_DEACTIVATED'
        }
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      res.status(401).json({
        error: {
          message: 'Invalid email or password.',
          code: 'INVALID_CREDENTIALS'
        }
      });
      return;
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Return user data without password
    const userData = user.toJSON();

    res.status(200).json({
      message: 'Login successful.',
      data: {
        user: userData,
        token,
        refreshToken
      }
    });
  } catch (error: any) {
    logger.error('Login error', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: {
        message: 'Internal server error during login.',
        code: 'LOGIN_ERROR'
      }
    });
  }
};

/**
 * Refresh token
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: requestRefreshToken } = req.body as RefreshTokenRequest;

    if (!requestRefreshToken) {
      res.status(400).json({
        error: {
          message: 'Refresh token is required.',
          code: 'REFRESH_TOKEN_REQUIRED'
        }
      });
      return;
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(requestRefreshToken);
    
    if (!decoded || decoded.type !== 'refresh') {
      res.status(401).json({
        error: {
          message: 'Invalid or expired refresh token.',
          code: 'INVALID_REFRESH_TOKEN'
        }
      });
      return;
    }

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

    // Generate new tokens (iat will be different due to timestamp)
    const newToken = generateToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    res.status(200).json({
      message: 'Token refreshed successfully.',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error during token refresh.',
        code: 'TOKEN_REFRESH_ERROR'
      }
    });
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
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

    // Retornar perfil público do usuário
    const publicProfile = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage,
      country: user.country,
      city: user.city,
      bio: user.bio,
      totalDistance: user.totalDistance,
      totalRaces: user.totalRaces,
      wins: user.wins,
      personalBest5k: user.personalBest5k,
      personalBest10k: user.personalBest10k,
      personalBestHalfMarathon: user.personalBestHalfMarathon,
      personalBestMarathon: user.personalBestMarathon,
      isVerified: user.isVerified,
    };

    res.status(200).json({
      message: 'Profile retrieved successfully.',
      data: {
        user: publicProfile
      }
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error while retrieving profile.',
        code: 'PROFILE_ERROR'
      }
    });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { firstName, lastName, username, birthDate, country, city, bio } = req.body as UpdateProfileRequest;

    // Check if username is taken by another user
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({
        where: {
          username,
          id: { [Op.ne]: user.id }
        }
      });

      if (existingUsername) {
        res.status(409).json({
          error: {
            message: 'Username is already taken.',
            code: 'USERNAME_EXISTS'
          }
        });
        return;
      }
    }

    // Update user
    const updates: any = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (username !== undefined) updates.username = username;
    if (birthDate !== undefined) updates.birthDate = birthDate ? new Date(birthDate) : null;
    if (country !== undefined) updates.country = country;
    if (city !== undefined) updates.city = city;
    if (bio !== undefined) updates.bio = bio;

    await user.update(updates);

    // Refresh user data
    await user.reload();

    // Retornar perfil público atualizado
    const publicProfile = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage,
      country: user.country,
      city: user.city,
      bio: user.bio,
      totalDistance: user.totalDistance,
      totalRaces: user.totalRaces,
      wins: user.wins,
      personalBest5k: user.personalBest5k,
      personalBest10k: user.personalBest10k,
      personalBestHalfMarathon: user.personalBestHalfMarathon,
      personalBestMarathon: user.personalBestMarathon,
      isVerified: user.isVerified,
    };

    res.status(200).json({
      message: 'Profile updated successfully.',
      data: {
        user: publicProfile
      }
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error while updating profile.',
        code: 'UPDATE_PROFILE_ERROR'
      }
    });
  }
};

/**
 * Change password
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        }
      });
      return;
    }

    const user = (req as any).user;
    const { currentPassword, newPassword } = req.body as ChangePasswordRequest;

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      res.status(401).json({
        error: {
          message: 'Current password is incorrect.',
          code: 'INVALID_CURRENT_PASSWORD'
        }
      });
      return;
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await user.update({ password: hashedPassword });

    res.status(200).json({
      message: 'Password changed successfully.'
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error while changing password.',
        code: 'CHANGE_PASSWORD_ERROR'
      }
    });
  }
};

/**
 * Logout (client-side operation, but we can invalidate refresh token if needed)
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // In a real implementation, you might want to:
    // 1. Add the refresh token to a blacklist
    // 2. Store blacklisted tokens in Redis with TTL
    // 3. Check blacklist during token refresh
    
    res.status(200).json({
      message: 'Logout successful. Please remove tokens from client storage.'
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error during logout.',
        code: 'LOGOUT_ERROR'
      }
    });
  }
};

export default {
  register,
  login,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  logout
};