import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone, studentEmail } = await request.json()

    // Validate required fields
    if (!name || !email || !password || !studentEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if parent email already exists
    const existingUser = await query(
      'SELECT id FROM auth.users WHERE email = $1',
      [email]
    )

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Find student by email to link with parent
    const studentResult = await query(
      `SELECT s.id, s.user_id, u.email
       FROM students s
       JOIN auth.users u ON u.id = s.user_id
       WHERE u.email = $1`,
      [studentEmail]
    )

    if (studentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Student not found. Please check the email address.' },
        { status: 404 }
      )
    }

    const student = studentResult.rows[0]

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user with role 'parent'
    const userResult = await query(
      `INSERT INTO auth.users (email, password_hash, role, created_at)
       VALUES ($1, $2, 'parent', NOW())
       RETURNING id, email, role`,
      [email, hashedPassword]
    )

    const user = userResult.rows[0]

    // Create parent record
    const parentResult = await query(
      `INSERT INTO parents (user_id, name, phone, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id`,
      [user.id, name, phone || null]
    )

    const parent = parentResult.rows[0]

    // Link student to parent
    await query(
      'UPDATE students SET parent_id = $1 WHERE id = $2',
      [parent.id, student.id]
    )

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name
      }
    })

  } catch (error: any) {
    console.error('Parent signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
