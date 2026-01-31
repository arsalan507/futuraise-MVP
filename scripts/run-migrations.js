#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  host: '51.195.46.40',
  port: 54320,
  database: 'postgres',
  user: 'postgres',
  password: 'MsTLvG8wNMzT6g11yAyemkOD3GgBefei',
  max: 1,
  connectionTimeoutMillis: 5000,
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🔌 Connected to PostgreSQL database');

    // Step 1: Create auth schema and auth.users table
    console.log('\n📝 Creating auth schema and users table...');
    await client.query(`
      -- Create auth schema
      CREATE SCHEMA IF NOT EXISTS auth;

      -- Create auth.users table
      CREATE TABLE IF NOT EXISTS auth.users (
        instance_id UUID,
        id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
        aud VARCHAR(255),
        role VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        encrypted_password VARCHAR(255),
        email_confirmed_at TIMESTAMPTZ,
        invited_at TIMESTAMPTZ,
        confirmation_token VARCHAR(255),
        confirmation_sent_at TIMESTAMPTZ,
        recovery_token VARCHAR(255),
        recovery_sent_at TIMESTAMPTZ,
        email_change_token_new VARCHAR(255),
        email_change VARCHAR(255),
        email_change_sent_at TIMESTAMPTZ,
        last_sign_in_at TIMESTAMPTZ,
        raw_app_meta_data JSONB,
        raw_user_meta_data JSONB,
        is_super_admin BOOLEAN,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        phone VARCHAR(15),
        phone_confirmed_at TIMESTAMPTZ,
        phone_change VARCHAR(15),
        phone_change_token VARCHAR(255),
        phone_change_sent_at TIMESTAMPTZ,
        confirmed_at TIMESTAMPTZ,
        email_change_token_current VARCHAR(255),
        email_change_confirm_status SMALLINT,
        banned_until TIMESTAMPTZ,
        reauthentication_token VARCHAR(255),
        reauthentication_sent_at TIMESTAMPTZ,
        is_sso_user BOOLEAN DEFAULT FALSE,
        deleted_at TIMESTAMPTZ
      );

      -- Add index on email
      CREATE INDEX IF NOT EXISTS users_email_idx ON auth.users (email);

      -- Function for auth.uid() used in RLS policies
      CREATE OR REPLACE FUNCTION auth.uid()
      RETURNS UUID AS $$
        SELECT NULLIF(current_setting('request.jwt.claim.sub', TRUE), '')::UUID;
      $$ LANGUAGE sql STABLE;
    `);
    console.log('✅ Auth schema and users table created');

    // Step 2: Run initial schema migration
    console.log('\n📝 Running initial schema migration...');
    const migrationPath = path.join(__dirname, '../supabase/migrations/20240128000000_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    await client.query(migrationSQL);
    console.log('✅ Initial schema migration completed');

    // Step 3: Run checkpoint progress migration if it exists
    const checkpointMigrationPath = path.join(__dirname, '../supabase/migrations/20240128100000_add_checkpoint_progress.sql');
    if (fs.existsSync(checkpointMigrationPath)) {
      console.log('\n📝 Running checkpoint progress migration...');
      const checkpointSQL = fs.readFileSync(checkpointMigrationPath, 'utf8');
      await client.query(checkpointSQL);
      console.log('✅ Checkpoint progress migration completed');
    }

    // Step 4: Verify tables were created
    console.log('\n🔍 Verifying database tables...');
    const result = await client.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema IN ('public', 'auth')
      AND table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name;
    `);

    console.log('\n📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_schema}.${row.table_name}`);
    });

    console.log('\n✨ All migrations completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
