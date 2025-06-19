/**
 * Authentication and Authorization Middleware
 * JWT-based authentication and role-based authorization
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        roles: string[];
      };
    }
  }
}

interface JwtPayload {
  id: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

/**
 * Authentication middleware
 * Verifies JWT token and sets user in request
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      roles: decoded.roles
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
      return;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Authorization middleware factory
 * Checks if user has required roles
 */
export const authorize = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const userRoles = req.user.roles;
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: requiredRoles,
        current: userRoles
      });
      return;
    }
    
    next();
  };
};

/**
 * Optional authentication middleware
 * Sets user if token is provided, but doesn't require it
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      roles: decoded.roles
    };
    
    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

/**
 * Role checking utilities
 */
export const hasRole = (user: Express.Request['user'], role: string): boolean => {
  return user?.roles.includes(role) || false;
};

export const hasAnyRole = (user: Express.Request['user'], roles: string[]): boolean => {
  return roles.some(role => hasRole(user, role));
};

export const isAdmin = (user: Express.Request['user']): boolean => {
  return hasRole(user, 'admin');
};

export const isManager = (user: Express.Request['user']): boolean => {
  return hasRole(user, 'manager');
};

/**
 * JWT token utilities
 */
export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  
  return jwt.sign(payload, jwtSecret, { expiresIn });
};

export const verifyToken = (token: string): JwtPayload => {
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.verify(token, jwtSecret) as JwtPayload;
};

/**
 * API Key authentication (alternative to JWT)
 */
export const authenticateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.API_KEY;
  
  if (!apiKey || !validApiKey || apiKey !== validApiKey) {
    res.status(401).json({
      success: false,
      message: 'Valid API key is required'
    });
    return;
  }
  
  // Set a system user for API key requests
  req.user = {
    id: 'system',
    email: 'system@api',
    roles: ['admin'] // API key has admin privileges
  };
  
  next();
};

/**
 * Combined authentication middleware
 * Accepts either JWT token or API key
 */
export const authenticateFlexible = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] as string;
  
  if (apiKey) {
    authenticateApiKey(req, res, next);
  } else if (authHeader) {
    authenticate(req, res, next);
  } else {
    res.status(401).json({
      success: false,
      message: 'Authentication required (JWT token or API key)'
    });
  }
};
