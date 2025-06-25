import { Pool } from 'pg';
import type { Request, Response } from 'express';

interface DataParams {
  id: string;
}

interface SearchQuery {
  query: string;
  page?: string;
  limit?: string;
}

export class DataController {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getData(req: Request, res: Response) {
    try {
      const result = await this.pool.query('SELECT * FROM data ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error) {
      console.error('Get data error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async createData(req: Request, res: Response) {
    try {
      const { title, content } = req.body;
      const result = await this.pool.query(
        'INSERT INTO data (title, content) VALUES ($1, $2) RETURNING *',
        [title, content]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create data error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async updateData(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, content } = req.body;
      const result = await this.pool.query(
        'UPDATE data SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        [title, content, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Data not found' });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update data error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async deleteData(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await this.pool.query('DELETE FROM data WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Data not found' });
      }
      res.json({ message: 'Data deleted successfully' });
    } catch (error) {
      console.error('Delete data error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }

  async searchData(req: Request<{}, {}, {}, SearchQuery>, res: Response) {
    const { query, page = '1', limit = '10' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
      const result = await this.pool.query(
        'SELECT * FROM data_entries WHERE title ILIKE $1 OR description ILIKE $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [`%${query}%`, parseInt(limit), offset]
      );

      const countResult = await this.pool.query(
        'SELECT COUNT(*) FROM data_entries WHERE title ILIKE $1 OR description ILIKE $1',
        [`%${query}%`]
      );

      res.json({
        success: true,
        data: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      console.error('Error searching data:', error);
      res.status(500).json({ success: false, message: 'Failed to search data' });
    }
  }

  async getDataById(req: Request<DataParams>, res: Response) {
    const { id } = req.params;

    try {
      const result = await this.pool.query('SELECT * FROM data_entries WHERE id = $1', [id]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Data entry not found' });
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Error fetching data entry:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch data entry' });
    }
  }
}
