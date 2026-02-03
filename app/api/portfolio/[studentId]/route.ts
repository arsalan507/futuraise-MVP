import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const { studentId } = params

    // Fetch published portfolio with student name
    const result = await query(`
      SELECT
        p.*,
        s.name as student_name
      FROM projects p
      JOIN students s ON s.id = p.student_id
      WHERE p.student_id = $1 AND p.portfolio_published = true
    `, [studentId])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Portfolio not found or not published' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      portfolio: result.rows[0]
    })

  } catch (error: any) {
    console.error('Get public portfolio error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
