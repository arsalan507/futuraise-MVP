import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, grade } = body

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM auth.users WHERE email = $1',
      [email]
    )

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user in auth.users table
    const userResult = await query(
      `INSERT INTO auth.users (
        id, instance_id, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        aud, role, raw_app_meta_data, raw_user_meta_data
      ) VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000',
        $1, $2, NOW(), NOW(), NOW(),
        'authenticated', 'authenticated',
        '{"provider": "email", "providers": ["email"]}',
        $3
      ) RETURNING id, email`,
      [email, hashedPassword, JSON.stringify({ name })]
    )

    const userId = userResult.rows[0].id

    // Create student profile
    await query(
      `INSERT INTO students (user_id, name, grade, current_checkpoint)
       VALUES ($1, $2, $3, 'welcome')`,
      [userId, name, grade || 10]
    )

    // Generate JWT token
    const token = jwt.sign(
      { userId, email, name },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        name
      },
      token
    })

  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create account' },
      { status: 500 }
    )
  }
}
