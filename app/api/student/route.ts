// Student API Route - Get and update student data
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCheckpointsWithStatus, calculateProgress, getCurrentWeek } from '@/lib/checkpoints/checkpoint-manager'
import { getInitialMessage } from '@/lib/claude/chat-service'

// GET - Get student data with progress
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get student data
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', user.id)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Get project data
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get conversation history for current checkpoint
    const { data: conversation } = await supabase
      .from('conversations')
      .select('messages, context')
      .eq('student_id', user.id)
      .eq('checkpoint', student.current_checkpoint)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get completed checkpoints count
    const { count: completedCount } = await supabase
      .from('checkpoints')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .eq('status', 'completed')

    // Calculate streak (days with activity)
    const { data: recentEvents } = await supabase
      .from('events')
      .select('created_at')
      .eq('student_id', user.id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })

    // Calculate streak days
    let streakDays = 0
    if (recentEvents && recentEvents.length > 0) {
      const uniqueDays = new Set(
        recentEvents.map(e => new Date(e.created_at).toDateString())
      )
      const today = new Date().toDateString()
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()

      if (uniqueDays.has(today) || uniqueDays.has(yesterday)) {
        const sortedDays = Array.from(uniqueDays).sort((a, b) =>
          new Date(b).getTime() - new Date(a).getTime()
        )

        for (let i = 0; i < sortedDays.length; i++) {
          const expectedDay = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toDateString()
          if (sortedDays.includes(expectedDay)) {
            streakDays++
          } else {
            break
          }
        }
      }
    }

    // Get checkpoints with status
    const checkpoints = getCheckpointsWithStatus(student.current_checkpoint)
    const progress = calculateProgress(student.current_checkpoint)

    // Get initial message for current checkpoint if no conversation
    const messages = conversation?.messages || []
    if (messages.length === 0) {
      messages.push({
        role: 'assistant',
        content: getInitialMessage(student.current_checkpoint, student.name),
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        grade: student.grade,
        currentWeek: student.current_week,
        currentCheckpoint: student.current_checkpoint,
        onboardingCompleted: student.onboarding_completed,
        createdAt: student.created_at
      },
      progress: {
        completedCheckpoints: completedCount || 0,
        totalCheckpoints: 11,
        percentComplete: progress,
        streakDays,
        currentWeek: getCurrentWeek(student.current_checkpoint)
      },
      checkpoints,
      project: project ? {
        id: project.id,
        title: project.title,
        problemStatement: project.problem_statement,
        targetPerson: project.target_person,
        solutionType: project.solution_type,
        toolsUsed: project.tools_used,
        status: project.status
      } : null,
      conversation: {
        messages,
        context: conversation?.context || {}
      }
    })

  } catch (error) {
    console.error('Student API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create student profile (after signup)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { name, grade, age } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check if student already exists
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existingStudent) {
      return NextResponse.json(
        { error: 'Student profile already exists' },
        { status: 409 }
      )
    }

    // Create student profile
    const { data: student, error: createError } = await supabase
      .from('students')
      .insert({
        id: user.id,
        name,
        email: user.email,
        grade: grade || null,
        age: age || null,
        current_week: 1,
        current_checkpoint: 'welcome',
        onboarding_completed: false
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating student:', createError)
      return NextResponse.json(
        { error: 'Failed to create student profile' },
        { status: 500 }
      )
    }

    // Log signup event
    await supabase.from('events').insert({
      student_id: user.id,
      event_type: 'signup',
      event_data: { name, grade }
    })

    return NextResponse.json({
      success: true,
      student
    })

  } catch (error) {
    console.error('Student Create API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
