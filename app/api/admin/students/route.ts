import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'
import { calculateProgress } from '@/lib/checkpoints/checkpoint-manager'

const JWT_SECRET = process.env.JWT_SECRET || 'futuraise-secret-key-change-in-production'

export async function GET(request: NextRequest) {
  try {
    // Get and verify JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get all students with their progress
    const result = await query(`
      SELECT
        s.id,
        s.name,
        s.email,
        s.current_checkpoint,
        s.created_at,
        s.updated_at,
        MAX(e.created_at) as last_active
      FROM students s
      LEFT JOIN auth.users u ON u.id = s.user_id
      LEFT JOIN events e ON e.student_id = s.id
      GROUP BY s.id, s.name, s.email, s.current_checkpoint, s.created_at, s.updated_at
      ORDER BY s.created_at DESC
    `)

    const students = result.rows.map(student => ({
      ...student,
      progress: calculateProgress(student.current_checkpoint)
    }))

    return NextResponse.json({
      success: true,
      students
    })

  } catch (error: any) {
    console.error('Get students error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
