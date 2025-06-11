const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'fspfc',
  password: 'dcb62147abbe4cbfb8e477fe15cdfd33', // Replace with your actual database password
  port: 5432,
});

async function createAdminUser() {
  const username = 'admin';
  const password = 'admin123';
  const email = 'admin@fspfc.com';
  
  try {
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Insert the admin user
    const query = `
      INSERT INTO admins (id, username, password_hash, email, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, username, email, role;
    `;
    
    const values = [uuidv4(), username, passwordHash, email, 'super_admin'];
    const result = await pool.query(query, values);
    
    console.log('Admin user created successfully:');
    console.log(result.rows[0]);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser(); 