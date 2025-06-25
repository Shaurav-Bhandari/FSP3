import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db'; // adjust if needed

// Extend Express Request type to include user and admin
declare global {
  namespace Express {
    interface Request {
      user?: any;
      admin?: any;
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from HTTP-only cookie instead of Authorization header
    const token = req.cookies.authToken;
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as { id: number };
    const result = await pool.query('SELECT * FROM users WHERE id = $1 AND is_active = true', [decoded.id]);
    
    if (result.rows.length === 0) {
      // Clear invalid cookie
      res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      return res.status(401).json({ error: 'Invalid token.' });
    }
    
    req.user = result.rows[0];
    next();
  } catch (error) {
    // Clear invalid cookie on error
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
    res.status(401).json({ error: 'Invalid token.' });
  }
};

export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from HTTP-only cookie instead of Authorization header
    const token = req.cookies.adminToken; // Using different cookie name for admin
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as { id: number };
    const result = await pool.query('SELECT * FROM admins WHERE id = $1 AND is_active = true', [decoded.id]);
    
    if (result.rows.length === 0) {
      // Clear invalid cookie
      res.clearCookie('adminToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      return res.status(401).json({ error: 'Invalid token.' });
    }
    
    req.admin = result.rows[0];
    next();
  } catch (error) {
    // Clear invalid cookie on error
    res.clearCookie('adminToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
    res.status(401).json({ error: 'Invalid token.' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(403).json({ error: 'Admin authentication required.' });
    }
    
    if (!roles.includes(req.admin?.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.admin) {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
};

// Optional: Combined middleware that checks both user and admin cookies
export const authenticateAny = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userToken = req.cookies.authToken;
    const adminToken = req.cookies.adminToken;
    
    if (!userToken && !adminToken) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Try admin token first
    if (adminToken) {
      try {
        const decoded = jwt.verify(adminToken, process.env.JWT_SECRET_KEY!) as { id: number };
        const result = await pool.query('SELECT * FROM admins WHERE id = $1 AND is_active = true', [decoded.id]);
        
        if (result.rows.length > 0) {
          req.admin = result.rows[0];
          return next();
        }
      } catch (error) {
        // Clear invalid admin cookie
        res.clearCookie('adminToken', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/'
        });
      }
    }

    // Try user token
    if (userToken) {
      try {
        const decoded = jwt.verify(userToken, process.env.JWT_SECRET_KEY!) as { id: number };
        const result = await pool.query('SELECT * FROM users WHERE id = $1 AND is_active = true', [decoded.id]);
        
        if (result.rows.length > 0) {
          req.user = result.rows[0];
          return next();
        }
      } catch (error) {
        // Clear invalid user cookie
        res.clearCookie('authToken', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/'
        });
      }
    }

    return res.status(401).json({ error: 'Invalid token.' });
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed.' });
  }
};