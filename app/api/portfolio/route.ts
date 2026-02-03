import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'futuraise-secret-key-change-in-production'

// GET - Fetch student's portfolio
export async function GET(request: NextRequest) {
  try {
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

    const userId = decoded.userId

    // Get student
    const studentResult = await query(
      `SELECT id FROM students WHERE user_id = $1`,
      [userId]
    )

    if (studentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const studentId = studentResult.rows[0].id

    // Get project/portfolio
    const projectResult = await query(
      `SELECT * FROM projects WHERE student_id = $1`,
      [studentId]
    )

    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      portfolio: projectResult.rows[0]
    })

  } catch (error: any) {
    console.error('Get portfolio error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Update portfolio content
export async function POST(request: NextRequest) {
  try {
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

    const userId = decoded.userId

    // Get student
    const studentResult = await query(
      `SELECT id FROM students WHERE user_id = $1`,
      [userId]
    )

    if (studentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const studentId = studentResult.rows[0].id

    const {
      impact_story,
      user_testimonial,
      demo_video_url,
      portfolio_published
    } = await request.json()

    // Update project with portfolio content
    await query(
      `UPDATE projects
       SET impact_story = $1,
           user_testimonial = $2,
           demo_video_url = $3,
           portfolio_published = $4,
           updated_at = NOW()
       WHERE student_id = $5`,
      [impact_story, user_testimonial, demo_video_url, portfolio_published, studentId]
    )

    // Generate portfolio URL if publishing
    if (portfolio_published) {
      const portfolioUrl = `${process.env.NEXT_PUBLIC_APP_URL}/portfolio/${studentId}`
      await query(
        `UPDATE projects SET portfolio_url = $1 WHERE student_id = $2`,
        [portfolioUrl, studentId]
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Portfolio updated successfully'
    })

  } catch (error: any) {
    console.error('Update portfolio error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
