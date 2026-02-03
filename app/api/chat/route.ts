// Chat API Route - Handles messages to/from Claude (Max)
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'
import { chatWithMax, type StudentContext, type Message } from '@/lib/claude/chat-service'
import { getNextCheckpoint, getCurrentWeek } from '@/lib/checkpoints/checkpoint-manager'

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
    console.log('[CHAT API] Looking for conversation:', { studentId: student.id, checkpoint: student.current_checkpoint })
    let conversationResult = await query(
      `SELECT * FROM conversations
       WHERE student_id = $1 AND checkpoint = $2
       ORDER BY created_at DESC LIMIT 1`,
      [student.id, student.current_checkpoint]
    )

    let conversation = conversationResult.rows[0]
    console.log('[CHAT API] Found conversation:', conversation ? conversation.id : 'NONE')

    if (!conversation) {
      // Create new conversation
      console.log('[CHAT API] Creating new conversation...')
      const newConvResult = await query(
        `INSERT INTO conversations (student_id, checkpoint, messages, context)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [student.id, student.current_checkpoint, JSON.stringify([]), JSON.stringify({})]
      )
      conversation = newConvResult.rows[0]
      console.log('[CHAT API] Created conversation:', conversation.id)
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
      currentWeek: getCurrentWeek(student.current_checkpoint),
      targetPerson: project?.target_person || conversationContext?.targetPerson,
      problemStatement: project?.problem_statement || conversationContext?.problemStatement,
      problemDescription: project?.problem_description || conversationContext?.problemDescription,
      solutionType: project?.solution_type || conversationContext?.solutionType,
      toolsUsed: project?.tools_used || conversationContext?.toolsUsed,
      buildProgress: project?.status || conversationContext?.buildProgress,
      conversationHistory: conversationHistory as Message[]
    }

    // Get response from Claude
    console.log('[CHAT API] Calling Claude with message:', userMessage.substring(0, 50))
    const response = await chatWithMax(userMessage, context)
    console.log('[CHAT API] Got Claude response:', response.message.substring(0, 50))

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

    console.log('[CHAT API] Updating conversation:', {
      conversationId: conversation.id,
      messageCount: updatedMessages.length,
      contextKeys: Object.keys(updatedContext)
    })

    const updateResult = await query(
      `UPDATE conversations
       SET messages = $1, context = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id`,
      [JSON.stringify(updatedMessages), JSON.stringify(updatedContext), conversation.id]
    )

    console.log('[CHAT API] Conversation updated:', updateResult.rows[0]?.id ? 'SUCCESS' : 'FAILED')

    // Log event
    console.log('[CHAT API] Logging event...')
    await query(
      `INSERT INTO events (student_id, event_type, event_data)
       VALUES ($1, $2, $3)`,
      [student.id, 'chat_message', JSON.stringify({
        checkpoint: student.current_checkpoint,
        messageLength: userMessage.length
      })]
    )
    console.log('[CHAT API] Event logged')

    // Handle checkpoint advancement
    let checkpointAdvanced = false
    let newCheckpoint = null

    if (response.shouldAdvanceCheckpoint) {
      const nextCheckpoint = getNextCheckpoint(student.current_checkpoint)

      if (nextCheckpoint) {
        console.log('[CHAT API] Advancing checkpoint:', {
          from: student.current_checkpoint,
          to: nextCheckpoint.name
        })

        // Update student's current checkpoint
        await query(
          `UPDATE students
           SET current_checkpoint = $1, updated_at = NOW()
           WHERE id = $2`,
          [nextCheckpoint.name, student.id]
        )

        // Save extracted data to student record
        if (response.extractedData) {
          const updates: string[] = []
          const values: any[] = []
          let paramIndex = 1

          if (response.extractedData.targetPerson) {
            updates.push(`target_person = $${paramIndex++}`)
            values.push(response.extractedData.targetPerson)
          }
          if (response.extractedData.problemDescription) {
            updates.push(`problem_description = $${paramIndex++}`)
            values.push(response.extractedData.problemDescription)
          }
          if (response.extractedData.problemStatement) {
            updates.push(`problem_statement = $${paramIndex++}`)
            values.push(response.extractedData.problemStatement)
          }
          if (response.extractedData.solutionType) {
            updates.push(`solution_type = $${paramIndex++}`)
            values.push(response.extractedData.solutionType)
          }
          if (response.extractedData.primaryTool) {
            updates.push(`primary_tool = $${paramIndex++}`)
            values.push(response.extractedData.primaryTool)
          }

          if (updates.length > 0) {
            values.push(student.id)
            await query(
              `UPDATE students
               SET ${updates.join(', ')}, updated_at = NOW()
               WHERE id = $${paramIndex}`,
              values
            )
            console.log('[CHAT API] Saved extracted data:', response.extractedData)
          }
        }

        // Create or update project if solution was designed
        if (nextCheckpoint.name === 'building_started' && response.extractedData) {
          await query(
            `INSERT INTO projects (student_id, title, problem_statement, problem_description, target_person, solution_type, primary_tool, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (student_id)
             DO UPDATE SET
               problem_statement = EXCLUDED.problem_statement,
               solution_type = EXCLUDED.solution_type,
               primary_tool = EXCLUDED.primary_tool,
               updated_at = NOW()`,
            [
              student.id,
              `AI Solution for ${student.target_person || 'someone'}`,
              student.problem_statement || response.extractedData.problemStatement,
              student.problem_description || response.extractedData.problemDescription,
              student.target_person || response.extractedData.targetPerson,
              response.extractedData.solutionType || student.solution_type,
              response.extractedData.primaryTool || student.primary_tool,
              'in_progress'
            ]
          )
          console.log('[CHAT API] Project created/updated')
        }

        // Log checkpoint advancement event
        await query(
          `INSERT INTO events (student_id, event_type, event_data)
           VALUES ($1, $2, $3)`,
          [student.id, 'checkpoint_completed', JSON.stringify({
            checkpoint: student.current_checkpoint,
            newCheckpoint: nextCheckpoint.name,
            extractedData: response.extractedData
          })]
        )

        checkpointAdvanced = true
        newCheckpoint = nextCheckpoint.name
        console.log('[CHAT API] Checkpoint advancement complete!')
      }
    }

    console.log('[CHAT API] Request completed successfully')
    return NextResponse.json({
      message: response.message,
      checkpointAdvanced,
      newCheckpoint
    })

  } catch (error: any) {
    console.error('[CHAT API] Error occurred:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
