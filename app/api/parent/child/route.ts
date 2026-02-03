import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'
import { calculateProgress, getCurrentWeek } from '@/lib/checkpoints/checkpoint-manager'

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

    const parentUserId = decoded.userId

    // Get parent record
    const parentResult = await query(
      `SELECT id FROM parents WHERE user_id = $1`,
      [parentUserId]
    )

    if (parentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }

    const parentId = parentResult.rows[0].id

    // Get child/student data
    const studentResult = await query(
      `SELECT s.*, u.email
       FROM students s
       JOIN auth.users u ON u.id = s.user_id
       WHERE s.parent_id = $1
       LIMIT 1`,
      [parentId]
    )

    if (studentResult.rows.length === 0) {
      return NextResponse.json({ error: 'No child found' }, { status: 404 })
    }

    const student = studentResult.rows[0]

    // Get project if exists
    const projectResult = await query(
      `SELECT * FROM projects WHERE student_id = $1 LIMIT 1`,
      [student.id]
    )

    // Check for pending interventions
    const interventionResult = await query(
      `SELECT COUNT(*) as count FROM interventions
       WHERE student_id = $1 AND status = 'pending'`,
      [student.id]
    )

    // Calculate progress
    const percentComplete = calculateProgress(student.current_checkpoint)
    const currentWeek = getCurrentWeek(student.current_checkpoint)

    // Calculate days active
    const daysActive = Math.floor(
      (new Date().getTime() - new Date(student.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        grade: student.grade,
        current_checkpoint: student.current_checkpoint,
        target_person: student.target_person,
        problem_statement: student.problem_statement,
        solution_type: student.solution_type,
        primary_tool: student.primary_tool,
        created_at: student.created_at,
      },
      progress: {
        percent_complete: percentComplete,
        current_week: currentWeek,
        days_active: daysActive
      },
      project: projectResult.rows.length > 0 ? {
        title: projectResult.rows[0].title,
        problem_statement: projectResult.rows[0].problem_statement,
        target_person: projectResult.rows[0].target_person,
        solution_type: projectResult.rows[0].solution_type,
        status: projectResult.rows[0].status
      } : null,
      needs_help: interventionResult.rows[0].count > 0
    })

  } catch (error: any) {
    console.error('Get child data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
