import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

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

    // Get all interventions with student names
    const result = await query(`
      SELECT
        i.*,
        s.name as student_name
      FROM interventions i
      JOIN students s ON s.id = i.student_id
      ORDER BY i.created_at DESC
      LIMIT 50
    `)

    return NextResponse.json({
      success: true,
      interventions: result.rows
    })

  } catch (error: any) {
    console.error('Get interventions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
