import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'futuraise-secret-key-change-in-production'

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Verify JWT token
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = decoded.userId

    // Get student data
    const studentResult = await query(
      `SELECT s.*, u.email
       FROM students s
       JOIN auth.users u ON u.id = s.user_id
       WHERE s.user_id = $1`,
      [userId]
    )

    if (studentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const student = studentResult.rows[0]

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        user_id: student.user_id,
        name: student.name,
        email: student.email,
        grade: student.grade,
        current_checkpoint: student.current_checkpoint,
        target_person: student.target_person,
        problem_statement: student.problem_statement,
        problem_description: student.problem_description,
        solution_type: student.solution_type,
        primary_tool: student.primary_tool,
        tools_used: student.tools_used,
        build_progress: student.build_progress,
        created_at: student.created_at,
        updated_at: student.updated_at,
      }
    })

  } catch (error: any) {
    console.error('Get student error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
