// controllers/cmsController.js
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma';

export class CMSController {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Admin Authentication
  async login(req: Request, res: Response) {
    try {
      const { name, password } = req.body;
      
      const admin = await prisma.admin.findFirst({
        where: {
          name,
          isActive: true
        }
      });

      if (!admin) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, admin.passwordHash);

      if (!validPassword) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      // Update last login
      await prisma.admin.update({
        where: { id: admin.id },
        data: { lastLogin: new Date() }
      });

      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: admin.role },
        process.env.JWT_SECRET_KEY || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // Set HTTP-only cookie for admin
      res.cookie('adminToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      });

      res.json({
        success: true,
        message: 'Login successful',
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // Content Management
  async getContent(req: Request, res: Response) {
    try {
      const { type } = req.query;
      let query = 'SELECT * FROM content WHERE is_active = true';
      let params: any[] = [];

      if (type) {
        query += ' AND type = $1';
        params.push(type);
      }

      query += ' ORDER BY order_index ASC, created_at DESC';

      const result = await this.pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Get content error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async createContent(req: Request, res: Response) {
    try {
      const {
        type,
        title,
        subtitle,
        description,
        image_url,
        button_text,
        button_url,
        order_index
      } = req.body;

      const result = await this.pool.query(
        `INSERT INTO content (type, title, subtitle, description, image_url, button_text, button_url, order_index, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [type, title, subtitle, description, image_url, button_text, button_url, order_index || 0, req.admin?.id]
      );

      // Log audit
      await this.logAudit(req.admin?.id, 'CREATE', 'content', result.rows[0].id, null, result.rows[0], req.ip || 'unknown');

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create content error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async updateContent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        type,
        title,
        subtitle,
        description,
        image_url,
        button_text,
        button_url,
        order_index,
        is_active
      } = req.body;

      // Get old values for audit
      const oldResult = await this.pool.query('SELECT * FROM content WHERE id = $1', [id]);
      
      const result = await this.pool.query(
        `UPDATE content SET 
         type = $1, title = $2, subtitle = $3, description = $4, 
         image_url = $5, button_text = $6, button_url = $7, 
         order_index = $8, is_active = $9, updated_by = $10
         WHERE id = $11 RETURNING *`,
        [type, title, subtitle, description, image_url, button_text, button_url, order_index, is_active, req.admin?.id, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Content not found' });
      }

      // Log audit
      await this.logAudit(req.admin?.id, 'UPDATE', 'content', id, oldResult.rows[0], result.rows[0], req.ip || 'unknown');

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update content error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async deleteContent(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Get old values for audit
      const oldResult = await this.pool.query('SELECT * FROM content WHERE id = $1', [id]);
      
      // Soft delete
      const result = await this.pool.query(
        'UPDATE content SET is_active = false, updated_by = $1 WHERE id = $2 RETURNING *',
        [req.admin?.id, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Content not found' });
      }

      // Log audit
      await this.logAudit(req.admin?.id, 'DELETE', 'content', id, oldResult.rows[0], result.rows[0], req.ip || 'unknown');

      res.json({ message: 'Content deleted successfully' });
    } catch (error) {
      console.error('Delete content error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // Team Management
  async getTeamMembers(req: Request, res: Response) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM team_members WHERE is_active = true ORDER BY order_index ASC, created_at DESC'
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Get team members error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async createTeamMember(req: Request, res: Response) {
    try {
      const {
        name,
        position,
        bio,
        image_url,
        email,
        phone,
        social_links,
        order_index
      } = req.body;

      const result = await this.pool.query(
        `INSERT INTO team_members (
          name, position, bio, image_url, email, phone, social_links, order_index, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [name, position, bio, image_url, email, phone, social_links, order_index || 0, req.admin?.id]
      );

      // Log audit
      await this.logAudit(req.admin?.id, 'CREATE', 'team_members', result.rows[0].id, null, result.rows[0], req.ip || 'unknown');

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create team member error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // Gallery Management
  async getGallery(req: Request, res: Response) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM gallery WHERE is_active = true ORDER BY order_index ASC, created_at DESC'
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Get gallery error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async createGalleryItem(req: Request, res: Response) {
    try {
      const {
        title,
        description,
        image_url,
        order_index
      } = req.body;

      const result = await this.pool.query(
        `INSERT INTO gallery (title, description, image_url, order_index, created_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [title, description, image_url, order_index || 0, req.admin?.id]
      );

      // Log audit
      await this.logAudit(req.admin?.id, 'CREATE', 'gallery', result.rows[0].id, null, result.rows[0], req.ip || 'unknown');

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create gallery item error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // Services Management
  async getServices(req: Request, res: Response) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM services WHERE is_active = true ORDER BY name ASC'
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Get services error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async createService(req: Request, res: Response) {
    try {
      const {
        name,
        description,
        price,
        duration_minutes
      } = req.body;

      const result = await this.pool.query(
        `INSERT INTO services (name, description, price, duration_minutes, created_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [name, description, price, duration_minutes, req.admin?.id]
      );

      // Log audit
      await this.logAudit(req.admin?.id, 'CREATE', 'services', result.rows[0].id, null, result.rows[0], req.ip || 'unknown');

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create service error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // Settings Management
  async getSettings(req: Request, res: Response) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM settings WHERE is_public = true OR $1 = true',
        [req.admin?.role === 'superadmin']
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async updateSetting(req: Request, res: Response) {
    try {
      const { key } = req.params;
      const { value } = req.body;

      const result = await this.pool.query(
        'UPDATE settings SET value = $1, updated_by = $2 WHERE key = $3 RETURNING *',
        [value, req.admin?.id, key]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Setting not found' });
      }

      // Log audit
      await this.logAudit(req.admin?.id, 'UPDATE', 'settings', key, null, result.rows[0], req.ip || 'unknown');

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update setting error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // Audit Log
  private async logAudit(
    adminId: string,
    action: string,
    tableName: string,
    recordId: string,
    oldValues: any,
    newValues: any,
    ipAddress: string
  ) {
    try {
      await this.pool.query(
        `INSERT INTO audit_log (admin_id, action, table_name, record_id, old_values, new_values, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [adminId, action, tableName, recordId, oldValues, newValues, ipAddress]
      );
    } catch (error) {
      console.error('Audit log error:', error);
    }
  }

  async getAuditLog(req: Request, res: Response) {
    try {
      const { table_name, admin_id, start_date, end_date } = req.query;
      let query = 'SELECT * FROM audit_log';
      const params: any[] = [];
      let whereClauses: string[] = [];

      if (table_name) {
        params.push(table_name);
        whereClauses.push(`table_name = $${params.length}`);
      }

      if (admin_id) {
        params.push(admin_id);
        whereClauses.push(`admin_id = $${params.length}`);
      }

      if (start_date) {
        params.push(start_date);
        whereClauses.push(`created_at >= $${params.length}`);
      }

      if (end_date) {
        params.push(end_date);
        whereClauses.push(`created_at <= $${params.length}`);
      }

      if (whereClauses.length > 0) {
        query += ' WHERE ' + whereClauses.join(' AND ');
      }

      query += ' ORDER BY created_at DESC LIMIT 100';

      const result = await this.pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Get audit log error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

export default CMSController;