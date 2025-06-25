// controllers/user.controller.ts

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface UpdateProfileBody {
  name: string;
  email: string;
}

interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

const userController = {
  register: async (req: Request<{}, {}, RegisterBody>, res: Response) => {
    const { name, email, password } = req.body;

    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          isActive: true
        }
      });

      if (existingUser) {
        return res.status(400).json({ success: false, message: 'User already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash: hashedPassword,
          role: 'customer'
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // Get system admin
      const systemAdmin = await prisma.admin.findFirst({
        where: { email: 'system@beautysalon.com' }
      });

      if (!systemAdmin) {
        throw new Error('System admin not found');
      }

      // Create audit log for registration
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'register',
          tableName: 'users',
          recordId: user.id,
          newValues: { name, email, role: 'customer' },
          ipAddress: req.ip || '0.0.0.0',
          createdBy: systemAdmin.id
        }
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user,
        token
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ success: false, message: 'Registration failed' });
    }
  },

  login: async (req: Request<{}, {}, LoginBody>, res: Response) => {
    const { email, password } = req.body;

    try {
      const user = await prisma.user.findFirst({
        where: {
          email,
          isActive: true
        }
      });

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);

      if (!isValidPassword) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // Get system admin
      const systemAdmin = await prisma.admin.findFirst({
        where: { email: 'system@beautysalon.com' }
      });

      if (!systemAdmin) {
        throw new Error('System admin not found');
      }

      // Create audit log for login
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'login',
          tableName: 'users',
          recordId: user.id,
          newValues: { lastLogin: new Date() },
          ipAddress: req.ip || '0.0.0.0',
          createdBy: systemAdmin.id
        }
      });

      // Set HTTP-only cookie for user
      res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      });

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ success: false, message: 'Failed to login' });
    }
  },

  getProfile: async (req: AuthRequest, res: Response) => {
    const userId = req.user.id;

    try {
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          lastLogin: true
        }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ success: true, data: user });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch profile' });
    }
  },

  updateProfile: async (req: AuthRequest & { body: UpdateProfileBody }, res: Response) => {
    const userId = req.user.id;
    const { name, email } = req.body;

    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { name }
          ],
          NOT: {
            id: userId
          },
          isActive: true
        }
      });

      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Name or email already exists' });
      }

      const oldUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true
        }
      });

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          name,
          email,
          updatedAt: new Date()
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'update_profile',
          tableName: 'users',
          recordId: userId,
          oldValues: oldUser,
          newValues: { name, email },
          ipAddress: req.ip,
          createdBy: null
        }
      });

      res.json({ success: true, message: 'Profile updated successfully', data: user });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
  },

  changePassword: async (req: AuthRequest & { body: ChangePasswordBody }, res: Response) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    try {
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          isActive: true
        }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);

      if (!isValidPassword) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: hashedNewPassword,
          updatedAt: new Date()
        }
      });

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'change_password',
          tableName: 'users',
          recordId: userId,
          ipAddress: req.ip,
          createdBy: null
        }
      });

      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ success: false, message: 'Failed to change password' });
    }
  }
};

export default userController;
