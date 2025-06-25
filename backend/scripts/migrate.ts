// scripts/migrate.ts - Migration runner (TypeScript)
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { Pool } from 'pg';
import pool from '../config/database';

class MigrationRunner {
  private migrationsPath: string;

  constructor() {
    this.migrationsPath = path.join(__dirname, '../migrations');
  }

  private async createMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(64)
      );
    `;
    await pool.query(query);
  }

  private async getExecutedMigrations(): Promise<string[]> {
    const result = await pool.query('SELECT filename FROM migrations ORDER BY id');
    return result.rows.map((row: { filename: string }) => row.filename);
  }

  private async getMigrationFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.migrationsPath);
      return files.filter(file => file.endsWith('.sql')).sort();
    } catch {
      console.log('No migrations directory found. Creating...');
      await fs.mkdir(this.migrationsPath, { recursive: true });
      return [];
    }
  }

  private async calculateChecksum(content: string): Promise<string> {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private async executeMigration(filename: string): Promise<void> {
    const filePath = path.join(this.migrationsPath, filename);
    const content = await fs.readFile(filePath, 'utf8');
    const checksum = await this.calculateChecksum(content);

    console.log(`Executing migration: ${filename}`);

    try {
      await pool.query('BEGIN');
      await pool.query(content);
      await pool.query(
        'INSERT INTO migrations (filename, checksum) VALUES ($1, $2)',
        [filename, checksum]
      );
      await pool.query('COMMIT');
      console.log(`✓ Migration ${filename} executed successfully`);
    } catch (error: any) {
      await pool.query('ROLLBACK');
      throw new Error(`Migration ${filename} failed: ${error.message}`);
    }
  }

  public async migrate(): Promise<void> {
    try {
      await this.createMigrationsTable();
      const executedMigrations = await this.getExecutedMigrations();
      const migrationFiles = await this.getMigrationFiles();

      const pendingMigrations = migrationFiles.filter(
        file => !executedMigrations.includes(file)
      );

      if (pendingMigrations.length === 0) {
        console.log('No pending migrations');
        return;
      }

      console.log(`Found ${pendingMigrations.length} pending migrations`);

      for (const filename of pendingMigrations) {
        await this.executeMigration(filename);
      }

      console.log('All migrations completed successfully');
    } catch (error: any) {
      console.error('Migration failed:', error.message);
      process.exit(1);
    }
  }

  public async rollback(): Promise<void> {
    try {
      const result = await pool.query(
        'SELECT filename FROM migrations ORDER BY id DESC LIMIT 1'
      );

      if (result.rows.length === 0) {
        console.log('No migrations to rollback');
        return;
      }

      const lastMigration = result.rows[0].filename;
      const rollbackFile = lastMigration.replace('.sql', '.rollback.sql');
      const rollbackPath = path.join(this.migrationsPath, rollbackFile);

      try {
        const rollbackContent = await fs.readFile(rollbackPath, 'utf8');

        await pool.query('BEGIN');
        await pool.query(rollbackContent);
        await pool.query('DELETE FROM migrations WHERE filename = $1', [lastMigration]);
        await pool.query('COMMIT');

        console.log(`✓ Rolled back migration: ${lastMigration}`);
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error(`Rollback file not found or failed: ${rollbackFile}`);
        throw error;
      }
    } catch (error: any) {
      console.error('Rollback failed:', error.message);
      process.exit(1);
    }
  }

  public async createMigration(name: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${timestamp}_${safeName}.sql`;
    const rollbackFilename = `${timestamp}_${safeName}.rollback.sql`;

    const migrationPath = path.join(this.migrationsPath, filename);
    const rollbackPath = path.join(this.migrationsPath, rollbackFilename);

    const now = new Date().toISOString();
    const migrationTemplate = `-- Migration: ${name}
-- Created: ${now}

-- Add your migration SQL here
-- Example:
-- CREATE TABLE example (
--   id SERIAL PRIMARY KEY,
--   name VARCHAR(255) NOT NULL
-- );
`;
    const rollbackTemplate = `-- Rollback for: ${name}
-- Created: ${now}

-- Add your rollback SQL here
-- Example:
-- DROP TABLE IF EXISTS example;
`;

    await fs.mkdir(this.migrationsPath, { recursive: true });
    await fs.writeFile(migrationPath, migrationTemplate);
    await fs.writeFile(rollbackPath, rollbackTemplate);

    console.log('Created migration files:');
    console.log(`  ${filename}`);
    console.log(`  ${rollbackFilename}`);
  }

  public async status(): Promise<void> {
    try {
      await this.createMigrationsTable();
      const executedMigrations = await this.getExecutedMigrations();
      const migrationFiles = await this.getMigrationFiles();

      console.log('\nMigration Status:');
      console.log('=================');

      for (const file of migrationFiles) {
        const status = executedMigrations.includes(file) ? '✓ Executed' : '✗ Pending';
        console.log(`${status} - ${file}`);
      }

      const pendingCount = migrationFiles.filter(f => !executedMigrations.includes(f)).length;
      console.log(`\nTotal: ${migrationFiles.length}, Executed: ${executedMigrations.length}, Pending: ${pendingCount}`);
    } catch (error: any) {
      console.error('Failed to get migration status:', error.message);
    }
  }
}

// CLI interface
async function main() {
  const runner = new MigrationRunner();
  const [command, ...args] = process.argv.slice(2);

  try {
    switch (command) {
      case 'up':
      case 'migrate':
        await runner.migrate();
        break;
      case 'down':
      case 'rollback':
        await runner.rollback();
        break;
      case 'create':
        if (!args[0]) {
          console.error('Please provide a migration name: npm run migrate create <name>');
          process.exit(1);
        }
        await runner.createMigration(args[0]);
        break;
      case 'status':
        await runner.status();
        break;
      default:
        console.log(`
Usage:
  npm run migrate up              - Run all pending migrations
  npm run migrate down            - Rollback last migration
  npm run migrate create <name>   - Create new migration
  npm run migrate status          - Show migration status
        `);
    }
  } catch (error: any) {
    console.error('Migration command failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

export default MigrationRunner;