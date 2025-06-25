// controllers/bookingController.js
import { Pool } from 'pg';
import * as nodemailer from 'nodemailer';
import type { Request, Response } from 'express';

interface BookingData {
  id: number;
  user_name: string;
  service_title: string;
  slot_start: Date;
  slot_end: Date;
  [key: string]: any;
}

export class BookingController {
  private pool: Pool;
  private emailTransporter: nodemailer.Transporter;

  constructor(pool: Pool) {
    this.pool = pool;
    this.emailTransporter = this.initEmailTransporter();
  }

  private initEmailTransporter() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Get available time slots
  async getAvailableSlots(req: Request, res: Response) {
    try {
      const { service_id, date_from, date_to } = req.query;

      let query = `
        SELECT ts.*, s.title as service_title, s.duration_minutes, s.price
        FROM time_slots ts
        JOIN services s ON ts.service_id = s.id
        WHERE ts.is_booked = false
        AND ts.slot_start >= CURRENT_TIMESTAMP
      `;
      
      let params: any[] = [];
      let paramCount = 0;

      if (service_id) {
        paramCount++;
        query += ` AND ts.service_id = $${paramCount}`;
        params.push(service_id);
      }

      if (date_from) {
        paramCount++;
        query += ` AND ts.slot_start >= $${paramCount}`;
        params.push(date_from);
      }

      if (date_to) {
        paramCount++;
        query += ` AND ts.slot_start <= $${paramCount}`;
        params.push(date_to);
      }

      query += ' ORDER BY ts.slot_start ASC';

      const result = await this.pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Get available slots error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // Create time slots (Admin only)
  async createTimeSlot(req: Request, res: Response) {
    try {
      const { service_id, slot_start, slot_end } = req.body;

      // Check for overlapping slots
      const overlapCheck = await this.pool.query(
        `SELECT id FROM time_slots 
         WHERE service_id = $1 
         AND (
           (slot_start <= $2 AND slot_end > $2) OR
           (slot_start < $3 AND slot_end >= $3) OR
           (slot_start >= $2 AND slot_end <= $3)
         )`,
        [service_id, slot_start, slot_end]
      );

      if (overlapCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Time slot overlaps with existing slot' });
      }

      const result = await this.pool.query(
        `INSERT INTO time_slots (service_id, slot_start, slot_end, created_by)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [service_id, slot_start, slot_end, req.admin?.id]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create time slot error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // Create booking
  async createBooking(req: Request, res: Response) {
    try {
      const {
        time_slot_id,
        first_name,
        last_name,
        email,
        phone,
        notes
      } = req.body;

      const client = await this.pool.connect();

      try {
        await client.query('BEGIN');

        // Check if time slot is available
        const slotResult = await client.query(
          `SELECT ts.*, s.title, s.price, s.duration_minutes
           FROM time_slots ts
           JOIN services s ON ts.service_id = s.id
           WHERE ts.id = $1 AND ts.is_booked = false`,
          [time_slot_id]
        );

        if (slotResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Time slot not available' });
        }

        const timeSlot = slotResult.rows[0];

        // Create or get user
        let userResult = await client.query(
          'SELECT id FROM users WHERE email = $1',
          [email]
        );

        let userId;
        if (userResult.rows.length === 0) {
          const newUserResult = await client.query(
            `INSERT INTO users (first_name, last_name, email, phone)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [first_name, last_name, email, phone]
          );
          userId = newUserResult.rows[0].id;
        } else {
          userId = userResult.rows[0].id;
          // Update user info
          await client.query(
            `UPDATE users SET first_name = $1, last_name = $2, phone = $3, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [first_name, last_name, phone, userId]
          );
        }

        // Create booking
        const bookingResult = await client.query(
          `INSERT INTO bookings (time_slot_id, user_id, service_id, total_price, notes)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [time_slot_id, userId, timeSlot.service_id, timeSlot.price, notes]
        );

        // Mark time slot as booked
        await client.query(
          'UPDATE time_slots SET is_booked = true, booking_id = $1 WHERE id = $2',
          [bookingResult.rows[0].id, time_slot_id]
        );

        await client.query('COMMIT');

        const booking = bookingResult.rows[0];

        // Send confirmation email
        await this.sendBookingConfirmation(email, {
          ...booking,
          user_name: `${first_name} ${last_name}`,
          service_title: timeSlot.title,
          slot_start: timeSlot.slot_start,
          slot_end: timeSlot.slot_end
        });

        res.status(201).json({
          ...booking,
          service_title: timeSlot.title,
          slot_start: timeSlot.slot_start,
          slot_end: timeSlot.slot_end
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // Get user bookings
  async getUserBookings(req: Request, res: Response) {
    try {
      const { user_id } = req.params;

      const result = await this.pool.query(
        `SELECT b.*, s.title as service_title, ts.slot_start, ts.slot_end
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         JOIN time_slots ts ON b.time_slot_id = ts.id
         WHERE b.user_id = $1
         ORDER BY ts.slot_start DESC`,
        [user_id]
      );

      res.json(result.rows);
    } catch (error) {
      console.error('Get user bookings error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // Get booking by confirmation code
  async getBookingByConfirmation(req: Request, res: Response) {
    try {
      const { confirmation_code } = req.params;

      const result = await this.pool.query(
        `SELECT b.*, s.title as service_title, ts.slot_start, ts.slot_end,
                u.first_name, u.last_name, u.email, u.phone
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         JOIN time_slots ts ON b.time_slot_id = ts.id
         JOIN users u ON b.user_id = u.id
         WHERE b.confirmation_code = $1`,
        [confirmation_code]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Get booking by confirmation error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // Cancel booking
  async cancelBooking(req: Request, res: Response) {
    try {
      const { booking_id } = req.params;
      const { reason } = req.body;

      const client = await this.pool.connect();

      try {
        await client.query('BEGIN');

        // Get booking details
        const bookingResult = await client.query(
          `SELECT b.*, s.title as service_title, ts.slot_start, ts.slot_end,
                  u.first_name, u.last_name, u.email
           FROM bookings b
           JOIN services s ON b.service_id = s.id
           JOIN time_slots ts ON b.time_slot_id = ts.id
           JOIN users u ON b.user_id = u.id
           WHERE b.id = $1`,
          [booking_id]
        );

        if (bookingResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Booking not found' });
        }

        const booking = bookingResult.rows[0];

        // Check if booking can be cancelled
        if (booking.status === 'cancelled') {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Booking is already cancelled' });
        }

        if (new Date(booking.slot_start) < new Date()) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Cannot cancel past bookings' });
        }

        // Update booking status
        await client.query(
          `UPDATE bookings 
           SET status = 'cancelled', cancellation_reason = $1, cancelled_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [reason, booking_id]
        );

        // Free up time slot
        await client.query(
          'UPDATE time_slots SET is_booked = false, booking_id = NULL WHERE id = $1',
          [booking.time_slot_id]
        );

        await client.query('COMMIT');

        // Send cancellation email
        await this.sendCancellationEmail(booking.email, {
          ...booking,
          user_name: `${booking.first_name} ${booking.last_name}`,
          cancellation_reason: reason
        });

        res.json({ message: 'Booking cancelled successfully' });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Cancel booking error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // Get all bookings (Admin only)
  async getAllBookings(req: Request, res: Response) {
    try {
      const { status, date_from, date_to, service_id } = req.query;
      let query = `
        SELECT b.*, s.title as service_title, ts.slot_start, ts.slot_end,
               u.first_name, u.last_name, u.email, u.phone
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        JOIN time_slots ts ON b.time_slot_id = ts.id
        JOIN users u ON b.user_id = u.id
        WHERE 1=1
      `;
      
      let params: any[] = [];
      let paramCount = 0;

      if (status) {
        paramCount++;
        query += ` AND b.status = $${paramCount}`;
        params.push(status);
      }

      if (date_from) {
        paramCount++;
        query += ` AND ts.slot_start >= $${paramCount}`;
        params.push(date_from);
      }

      if (date_to) {
        paramCount++;
        query += ` AND ts.slot_start <= $${paramCount}`;
        params.push(date_to);
      }

      if (service_id) {
        paramCount++;
        query += ` AND b.service_id = $${paramCount}`;
        params.push(service_id);
      }

      query += ' ORDER BY ts.slot_start DESC';

      const result = await this.pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Get all bookings error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // Update booking status (Admin only)
  async updateBookingStatus(req: Request, res: Response) {
    try {
      const { booking_id } = req.params;
      const { status, notes } = req.body;

      const result = await this.pool.query(
        `UPDATE bookings 
         SET status = $1, admin_notes = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 RETURNING *`,
        [status, notes, booking_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update booking status error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // Send booking confirmation email
  private async sendBookingConfirmation(email: string, booking: BookingData) {
    try {
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Booking Confirmation',
        html: `
          <h1>Booking Confirmation</h1>
          <p>Dear ${booking.user_name},</p>
          <p>Your booking has been confirmed:</p>
          <ul>
            <li>Service: ${booking.service_title}</li>
            <li>Date: ${new Date(booking.slot_start).toLocaleDateString()}</li>
            <li>Time: ${new Date(booking.slot_start).toLocaleTimeString()} - ${new Date(booking.slot_end).toLocaleTimeString()}</li>
            <li>Confirmation Code: ${booking.confirmation_code}</li>
          </ul>
          <p>Thank you for choosing our services!</p>
        `
      });
    } catch (error) {
      console.error('Send booking confirmation email error:', error);
    }
  }

  // Send cancellation email
  private async sendCancellationEmail(email: string, booking: BookingData) {
    try {
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Booking Cancellation',
        html: `
          <h1>Booking Cancellation</h1>
          <p>Dear ${booking.user_name},</p>
          <p>Your booking has been cancelled:</p>
          <ul>
            <li>Service: ${booking.service_title}</li>
            <li>Date: ${new Date(booking.slot_start).toLocaleDateString()}</li>
            <li>Time: ${new Date(booking.slot_start).toLocaleTimeString()} - ${new Date(booking.slot_end).toLocaleTimeString()}</li>
            <li>Reason: ${booking.cancellation_reason}</li>
          </ul>
          <p>If you have any questions, please contact us.</p>
        `
      });
    } catch (error) {
      console.error('Send cancellation email error:', error);
    }
  }

  // Generate time slots (Admin only)
  async generateTimeSlots(req: Request, res: Response) {
    try {
      const { service_id, start_date, end_date, start_time, end_time, interval_minutes } = req.body;

      const client = await this.pool.connect();

      try {
        await client.query('BEGIN');

        const slots = [];
        const start = new Date(`${start_date}T${start_time}`);
        const end = new Date(`${end_date}T${end_time}`);
        const interval = interval_minutes * 60 * 1000; // Convert to milliseconds

        for (let slotStart = start; slotStart < end; slotStart = new Date(slotStart.getTime() + interval)) {
          const slotEnd = new Date(slotStart.getTime() + interval);

          // Skip if slot end time is after the end time
          if (slotEnd > end) continue;

          // Skip if slot is in the past
          if (slotStart < new Date()) continue;

          // Check for overlapping slots
          const overlapCheck = await client.query(
            `SELECT id FROM time_slots 
             WHERE service_id = $1 
             AND (
               (slot_start <= $2 AND slot_end > $2) OR
               (slot_start < $3 AND slot_end >= $3) OR
               (slot_start >= $2 AND slot_end <= $3)
             )`,
            [service_id, slotStart, slotEnd]
          );

          if (overlapCheck.rows.length === 0) {
            slots.push({
              service_id,
              slot_start: slotStart,
              slot_end: slotEnd,
              created_by: req.admin?.id
            });
          }
        }

        if (slots.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'No valid slots could be generated' });
        }

        // Insert all slots
        const values = slots.map((slot, index) => {
          const offset = index * 4;
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
        }).join(', ');

        const params = slots.flatMap(slot => [
          slot.service_id,
          slot.slot_start,
          slot.slot_end,
          slot.created_by
        ]);

        await client.query(
          `INSERT INTO time_slots (service_id, slot_start, slot_end, created_by)
           VALUES ${values}`,
          params
        );

        await client.query('COMMIT');

        res.json({
          message: `${slots.length} time slots generated successfully`,
          slots
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Generate time slots error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // Delete time slot (Admin only)
  async deleteTimeSlot(req: Request, res: Response) {
    try {
      const { slot_id } = req.params;

      const result = await this.pool.query(
        'DELETE FROM time_slots WHERE id = $1 AND is_booked = false RETURNING *',
        [slot_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Time slot not found or already booked' });
      }

      res.json({ message: 'Time slot deleted successfully' });
    } catch (error) {
      console.error('Delete time slot error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  // Get booking statistics (Admin only)
  async getBookingStats(req: Request, res: Response) {
    try {
      const { period = 'month' } = req.query;

      let dateFilter;
      switch (period) {
        case 'week':
          dateFilter = 'CURRENT_DATE - INTERVAL \'7 days\'';
          break;
        case 'month':
          dateFilter = 'CURRENT_DATE - INTERVAL \'30 days\'';
          break;
        case 'year':
          dateFilter = 'CURRENT_DATE - INTERVAL \'1 year\'';
          break;
        default:
          dateFilter = 'CURRENT_DATE - INTERVAL \'30 days\'';
      }

      const stats = await this.pool.query(
        `SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
          SUM(CASE WHEN status = 'confirmed' THEN total_price ELSE 0 END) as total_revenue,
          AVG(CASE WHEN status = 'confirmed' THEN total_price ELSE NULL END) as average_price
         FROM bookings
         WHERE created_at >= ${dateFilter}`
      );

      const serviceStats = await this.pool.query(
        `SELECT 
          s.title,
          COUNT(b.id) as booking_count,
          SUM(CASE WHEN b.status = 'confirmed' THEN b.total_price ELSE 0 END) as revenue
         FROM services s
         LEFT JOIN bookings b ON s.id = b.service_id
         WHERE b.created_at >= ${dateFilter}
         GROUP BY s.id, s.title
         ORDER BY booking_count DESC`
      );

      res.json({
        period,
        overall: stats.rows[0],
        by_service: serviceStats.rows
      });
    } catch (error) {
      console.error('Get booking stats error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
}

export default BookingController;