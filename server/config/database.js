const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'fspfc',
  password: process.env.DB_PASSWORD || 'dcb62147abbe4cbfb8e477fe15cdfd33', // Remove default password for security
  port: process.env.DB_PORT || 5432,
  // Add connection timeout
  connectionTimeoutMillis: 5000,
  // Add idle timeout
  idleTimeoutMillis: 30000,
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    console.error('Please make sure:');
    console.error('1. PostgreSQL is installed and running');
    console.error('2. Database "fspfc" exists');
    console.error('3. User "postgres" exists with the correct password');
    console.error('4. Port 5432 is not blocked by firewall');
    console.error('5. Check your .env file for correct DB_PASSWORD');
  } else {
    console.log('Successfully connected to the database');
    release();
  }
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool; 