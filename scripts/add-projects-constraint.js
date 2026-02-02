// Add unique constraint to projects.student_id
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: '51.195.46.40',
  port: 54320,
  user: 'postgres',
  password: 'MsTLvG8wNMzT6g11yAyemkOD3GgBefei',
  database: 'postgres'
});

async function addConstraint() {
  try {
    await client.connect();
    console.log('Connected to database');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../supabase/migrations/20240202000000_add_projects_unique_constraint.sql'),
      'utf8'
    );

    console.log('Running migration...');
    await client.query(migrationSQL);

    console.log('✅ Unique constraint added successfully!');

    // Verify
    const result = await client.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'projects' AND constraint_type = 'UNIQUE'
    `);

    console.log('Constraints on projects table:', result.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

addConstraint();
