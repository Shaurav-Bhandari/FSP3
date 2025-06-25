import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'fspdb',
  password: process.env.DB_PASSWORD|| 'root',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Test the connection
pool.connect()
  .then(() => {
    console.log('✅ Database connection successful');
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  });

export default pool; 