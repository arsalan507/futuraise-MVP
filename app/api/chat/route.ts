// Chat API Route - Handles messages to/from Claude (Max)
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'
import { chatWithMax, type StudentContext, type Message } from '@/lib/claude/chat-service'

const JWT_SECRET = process.env.JWT_SECRET || 'futuraise-secret-key-change-in-production'

// GET - Return initial welcome message
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Hey! I'm Max, your AI building buddy! 👋\n\nOver the next 3 weeks, we're going to build something EPIC - an AI tool that solves a real problem for someone you care about.\n\nReady to get started?"
  })
}

// POST - Handle chat messages
export async function POST(request: NextRequest) {
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

    const userId = decoded.userId

    // Parse request body
    const { message: userMessage } = await request.json()

    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

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

    // Get or create conversation for current checkpoint
    let conversationResult = await query(
      `SELECT * FROM conversations
       WHERE student_id = $1 AND checkpoint = $2
       ORDER BY created_at DESC LIMIT 1`,
      [student.id, student.current_checkpoint]
    )

    let conversation = conversationResult.rows[0]

    if (!conversation) {
      // Create new conversation
      const newConvResult = await query(
        `INSERT INTO conversations (student_id, checkpoint, messages, context)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [student.id, student.current_checkpoint, JSON.stringify([]), JSON.stringify({})]
      )
      conversation = newConvResult.rows[0]
    }

    // Get project data if exists
    const projectResult = await query(
      `SELECT * FROM projects
       WHERE student_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [student.id]
    )
    const project = projectResult.rows[0]

    // Build context for Claude
    const conversationHistory = typeof conversation.messages === 'string'
      ? JSON.parse(conversation.messages)
      : conversation.messages || []

    const conversationContext = typeof conversation.context === 'string'
      ? JSON.parse(conversation.context)
      : conversation.context || {}

    const context: StudentContext = {
      studentId: student.id,
      studentName: student.name,
      grade: student.grade,
      currentCheckpoint: student.current_checkpoint,
      targetPerson: project?.target_person || conversationContext?.targetPerson,
      problemStatement: project?.problem_statement || conversationContext?.problemStatement,
      problemDescription: project?.problem_description || conversationContext?.problemDescription,
      solutionType: project?.solution_type || conversationContext?.solutionType,
      toolsUsed: project?.tools_used || conversationContext?.toolsUsed,
      buildProgress: project?.status || conversationContext?.buildProgress,
      conversationHistory: conversationHistory as Message[]
    }

    // Get response from Claude
    const response = await chatWithMax(userMessage, context)

    // Update conversation with new messages
    const updatedMessages = [
      ...conversationHistory,
      { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
      { role: 'assistant', content: response.message, timestamp: new Date().toISOString() }
    ]

    // Update context with extracted data
    const updatedContext = {
      ...conversationContext,
      ...response.extractedData
    }

    await query(
      `UPDATE conversations
       SET messages = $1, context = $2, updated_at = NOW()
       WHERE id = $3`,
      [JSON.stringify(updatedMessages), JSON.stringify(updatedContext), conversation.id]
    )

    // Log event
    await query(
      `INSERT INTO events (student_id, event_type, event_data)
       VALUES ($1, $2, $3)`,
      [student.id, 'chat_message', JSON.stringify({
        checkpoint: student.current_checkpoint,
        messageLength: userMessage.length
      })]
    )

    return NextResponse.json({
      message: response.message,
      checkpointAdvanced: false, // Simplified for now
      newCheckpoint: null
    })

  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
