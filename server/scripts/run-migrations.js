const fs = require('fs');
const path = require('path');
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

async function runMigrations() {
    try {
        // Read the migration file
        const migrationPath = path.join(__dirname, '../migrations/init.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Run the migration
        await pool.query(migrationSQL);
        console.log('Database migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

const password = 'your_desired_password'; // Replace with the password you want for your admin
const saltRounds = 10; // This should match the salt rounds used in your application

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('Hashed Password:', hash);
});

runMigrations(); 