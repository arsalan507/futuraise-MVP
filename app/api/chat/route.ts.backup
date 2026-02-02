// Chat API Route - Handles messages to/from Claude (Max)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatWithMax, type StudentContext, type Message } from '@/lib/claude/chat-service'
import { getNextCheckpoint, getCurrentWeek } from '@/lib/checkpoints/checkpoint-manager'

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

    // Parse request body
    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
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

    // Get or create conversation for current checkpoint
    let { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('student_id', user.id)
      .eq('checkpoint', student.current_checkpoint)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (convError || !conversation) {
      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          student_id: user.id,
          checkpoint: student.current_checkpoint,
          messages: [],
          context: {}
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating conversation:', createError)
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        )
      }
      conversation = newConv
    }

    // Get project data if exists
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Build context for Claude
    const context: StudentContext = {
      studentId: user.id,
      studentName: student.name,
      grade: student.grade,
      currentCheckpoint: student.current_checkpoint,
      currentWeek: student.current_week,
      targetPerson: project?.target_person || conversation?.context?.targetPerson,
      problemStatement: project?.problem_statement || conversation?.context?.problemStatement,
      problemDescription: project?.problem_description || conversation?.context?.problemDescription,
      solutionType: project?.solution_type || conversation?.context?.solutionType,
      toolsUsed: project?.tools_used || conversation?.context?.toolsUsed,
      buildProgress: project?.status || conversation?.context?.buildProgress,
      conversationHistory: (conversation?.messages || []) as Message[]
    }

    // Get response from Claude
    const response = await chatWithMax(message, context)

    // Update conversation with new messages
    const updatedMessages = [
      ...(conversation?.messages || []),
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: response.message, timestamp: new Date().toISOString() }
    ]

    // Update context with extracted data
    const updatedContext = {
      ...(conversation?.context || {}),
      ...response.extractedData
    }

    await supabase
      .from('conversations')
      .update({
        messages: updatedMessages,
        context: updatedContext,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversation.id)

    // Log event
    await supabase.from('events').insert({
      student_id: user.id,
      event_type: 'chat_message',
      event_data: {
        checkpoint: student.current_checkpoint,
        messageLength: message.length
      }
    })

    // Handle checkpoint advancement
    if (response.shouldAdvanceCheckpoint) {
      const nextCheckpoint = getNextCheckpoint(student.current_checkpoint)

      if (nextCheckpoint) {
        // Update student's current checkpoint
        await supabase
          .from('students')
          .update({
            current_checkpoint: nextCheckpoint.name,
            current_week: getCurrentWeek(nextCheckpoint.name),
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        // Mark current checkpoint as completed
        await supabase
          .from('checkpoints')
          .upsert({
            student_id: user.id,
            checkpoint_name: student.current_checkpoint,
            week: student.current_week,
            status: 'completed',
            completed_at: new Date().toISOString(),
            data: response.extractedData
          }, {
            onConflict: 'student_id,checkpoint_name'
          })

        // Create or update project with extracted data
        if (response.extractedData) {
          const projectUpdate: Record<string, any> = {}

          if (response.extractedData.targetPerson) {
            projectUpdate.target_person = response.extractedData.targetPerson
          }
          if (response.extractedData.problemDescription) {
            projectUpdate.problem_description = response.extractedData.problemDescription
          }
          if (response.extractedData.solutionType) {
            projectUpdate.solution_type = response.extractedData.solutionType
          }
          if (response.extractedData.primaryTool) {
            projectUpdate.tools_used = [response.extractedData.primaryTool]
          }

          if (Object.keys(projectUpdate).length > 0) {
            if (project) {
              await supabase
                .from('projects')
                .update(projectUpdate)
                .eq('id', project.id)
            } else {
              await supabase
                .from('projects')
                .insert({
                  student_id: user.id,
                  title: `AI Solution for ${response.extractedData.targetPerson || 'Someone'}`,
                  problem_statement: response.extractedData.problemDescription || 'To be defined',
                  ...projectUpdate
                })
            }
          }
        }

        // Log checkpoint completion event
        await supabase.from('events').insert({
          student_id: user.id,
          event_type: 'checkpoint_completed',
          event_data: {
            checkpoint: student.current_checkpoint,
            nextCheckpoint: nextCheckpoint.name,
            extractedData: response.extractedData
          }
        })
      }
    }

    return NextResponse.json({
      message: response.message,
      checkpointAdvanced: response.shouldAdvanceCheckpoint,
      newCheckpoint: response.shouldAdvanceCheckpoint
        ? getNextCheckpoint(student.current_checkpoint)?.name
        : null
    })

  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
