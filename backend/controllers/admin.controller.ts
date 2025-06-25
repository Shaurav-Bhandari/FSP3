// controllers/admin.controller.ts
import { Request, Response } from 'express';
import pool from '../db';
import { logAudit } from '../utils/audit';

interface UserParams {
    id: string;
}

interface UpdateUserRoleBody {
    role: 'admin' | 'staff' | 'customer';
}

const adminController = {
    getAllUsers: async (req: Request, res: Response) => {
        try {
            const result = await pool.query(
                'SELECT id, email, name, role, created_at, updated_at FROM users WHERE is_active = true ORDER BY created_at DESC'
            );
            res.json({
                success: true,
                data: result.rows,
                count: result.rowCount
            });
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch users' });
        }
    },

    deleteUser: async (req: Request<UserParams>, res: Response) => {
        const { id } = req.params;
        try {
            // Get old values for audit
            const oldResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
            
            if (oldResult.rowCount === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            // Soft delete
            const result = await pool.query(
                'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
                [id]
            );

            // Log audit
            await logAudit(
                req.admin?.id,
                'DELETE',
                'users',
                id,
                oldResult.rows[0],
                result.rows[0],
                req.ip || 'unknown'
            );

            res.json({ 
                success: true, 
                message: 'User deleted successfully', 
                data: result.rows[0] 
            });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ success: false, message: 'Failed to delete user' });
        }
    },

    getSystemStats: async (req: Request, res: Response) => {
        try {
            const [
                userCount,
                bookingCount,
                serviceCount,
                staffCount
            ] = await Promise.all([
                pool.query('SELECT COUNT(*) FROM users WHERE is_active = true'),
                pool.query('SELECT COUNT(*) FROM bookings'),
                pool.query('SELECT COUNT(*) FROM services WHERE is_active = true'),
                pool.query('SELECT COUNT(*) FROM staff')
            ]);

            res.json({
                success: true,
                stats: {
                    totalUsers: parseInt(userCount.rows[0].count),
                    totalBookings: parseInt(bookingCount.rows[0].count),
                    totalServices: parseInt(serviceCount.rows[0].count),
                    totalStaff: parseInt(staffCount.rows[0].count),
                    serverUptime: process.uptime()
                }
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch system statistics' });
        }
    },

    updateUserRole: async (req: Request<UserParams, {}, UpdateUserRoleBody>, res: Response) => {
        const { id } = req.params;
        const { role } = req.body;

        // Validate role
        if (!['admin', 'staff', 'customer'].includes(role)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid role. Must be one of: admin, staff, customer' 
            });
        }

        try {
            // Get old values for audit
            const oldResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
            
            if (oldResult.rowCount === 0) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            const result = await pool.query(
                'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
                [role, id]
            );

            // Log audit
            await logAudit(
                req.admin?.id,
                'UPDATE',
                'users',
                id,
                oldResult.rows[0],
                result.rows[0],
                req.ip || 'unknown'
            );

            res.json({
                success: true,
                message: 'User role updated successfully',
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Error updating user role:', error);
            res.status(500).json({ success: false, message: 'Failed to update user role' });
        }
    }
};

export default adminController;
