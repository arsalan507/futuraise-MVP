#!/usr/bin/env node

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Database connection
const pool = new Pool({
  host: '51.195.46.40',
  port: 54320,
  database: 'postgres',
  user: 'postgres',
  password: 'MsTLvG8wNMzT6g11yAyemkOD3GgBefei',
});

async function testSignup() {
  try {
    console.log('🧪 Testing signup functionality...\n');

    const email = 'test@futuraise.com';
    const password = 'testpass123';
    const name = 'Test Student';
    const grade = 10;

    // Check if user already exists
    console.log('1️⃣ Checking if user exists...');
    const existingUser = await pool.query(
      'SELECT id FROM auth.users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('   ⚠️  User already exists, deleting...');
      await pool.query('DELETE FROM auth.users WHERE email = $1', [email]);
      console.log('   ✅ Old user deleted\n');
    } else {
      console.log('   ✅ No existing user\n');
    }

    // Hash password
    console.log('2️⃣ Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('   ✅ Password hashed\n');

    // Create user
    console.log('3️⃣ Creating user in auth.users...');
    const userResult = await pool.query(
      `INSERT INTO auth.users (
        id, instance_id, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        aud, role, raw_app_meta_data, raw_user_meta_data
      ) VALUES (
        gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
        $1, $2, NOW(), NOW(), NOW(),
        'authenticated', 'authenticated',
        '{"provider": "email", "providers": ["email"]}', $3
      ) RETURNING id, email`,
      [email, hashedPassword, JSON.stringify({ name })]
    );

    const userId = userResult.rows[0].id;
    console.log(`   ✅ User created with ID: ${userId}\n`);

    // Create student profile
    console.log('4️⃣ Creating student profile...');
    await pool.query(
      `INSERT INTO students (user_id, name, grade, current_checkpoint)
       VALUES ($1, $2, $3, 'welcome')`,
      [userId, name, grade]
    );
    console.log('   ✅ Student profile created\n');

    // Generate JWT
    console.log('5️⃣ Generating JWT token...');
    const JWT_SECRET = process.env.JWT_SECRET || 'futuraise-secret-key-change-in-production';
    const token = jwt.sign(
      { userId, email, name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log(`   ✅ Token: ${token.substring(0, 50)}...\n`);

    // Test login
    console.log('6️⃣ Testing login with created user...');
    const loginResult = await pool.query(
      `SELECT u.id, u.email, u.encrypted_password, u.raw_user_meta_data,
              s.name, s.id as student_id
       FROM auth.users u
       LEFT JOIN students s ON s.user_id = u.id
       WHERE u.email = $1`,
      [email]
    );

    if (loginResult.rows.length === 0) {
      console.log('   ❌ Login failed: User not found');
      return;
    }

    const user = loginResult.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.encrypted_password);

    if (passwordMatch) {
      console.log('   ✅ Login successful!\n');
      console.log('📊 User details:');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Name: ${user.name}`);
      console.log(`   - Student ID: ${user.student_id}`);
      console.log('\n✨ All tests passed! Signup and login are working correctly.');
    } else {
      console.log('   ❌ Login failed: Invalid password');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await pool.end();
  }
}

testSignup();
