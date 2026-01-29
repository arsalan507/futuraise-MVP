// Student Service - Data management for students
import { createClient } from '@/lib/supabase/server'

export interface Student {
  id: string
  user_id: string
  name: string
  grade?: number
  parent_id?: string
  current_checkpoint: string
  target_person?: string
  problem_statement?: string
  problem_description?: string
  solution_type?: string
  primary_tool?: string
  tools_used?: string[]
  build_progress?: string
  created_at: string
  updated_at?: string
}

export interface StudentProgress {
  student: Student
  checkpointProgress: Array<{
    checkpoint_name: string
    status: string
    started_at?: string
    completed_at?: string
    data?: Record<string, any>
  }>
  totalMessages: number
  daysActive: number
}

// Get current student
export async function getCurrentStudent(): Promise<Student | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Error getting student:', error)
    return null
  }

  return data
}

// Get student by ID
export async function getStudentById(studentId: string): Promise<Student | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single()

  if (error) {
    console.error('Error getting student:', error)
    return null
  }

  return data
}

// Get student progress
export async function getStudentProgress(studentId: string): Promise<StudentProgress | null> {
  const supabase = await createClient()

  // Get student
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single()

  if (studentError || !student) {
    return null
  }

  // Get checkpoint progress
  const { data: checkpointProgress } = await supabase
    .from('checkpoint_progress')
    .select('*')
    .eq('student_id', studentId)
    .order('started_at', { ascending: true })

  // Get conversation stats
  const { data: conversations } = await supabase
    .from('conversations')
    .select('messages, created_at')
    .eq('student_id', studentId)

  const totalMessages = conversations?.reduce((sum, conv) => {
    return sum + (conv.messages?.length || 0)
  }, 0) || 0

  // Calculate days active
  const createdDate = new Date(student.created_at)
  const today = new Date()
  const daysActive = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

  return {
    student,
    checkpointProgress: checkpointProgress || [],
    totalMessages,
    daysActive
  }
}

// Update student data
export async function updateStudent(
  studentId: string,
  updates: Partial<Student>
): Promise<Student | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('students')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', studentId)
    .select()
    .single()

  if (error) {
    console.error('Error updating student:', error)
    return null
  }

  return data
}

// Create student (called after signup)
export async function createStudent(
  userId: string,
  name: string,
  grade?: number
): Promise<Student | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('students')
    .insert({
      user_id: userId,
      name,
      grade,
      current_checkpoint: 'welcome',
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating student:', error)
    return null
  }

  // Initialize first checkpoint
  await supabase
    .from('checkpoint_progress')
    .insert({
      student_id: data.id,
      checkpoint_name: 'welcome',
      status: 'in_progress',
      started_at: new Date().toISOString()
    })

  return data
}

// Get recent conversations
export async function getRecentConversations(studentId: string, limit = 5) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('student_id', studentId)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error getting conversations:', error)
    return []
  }

  return data || []
}

// Get current conversation or create new one
export async function getOrCreateConversation(studentId: string) {
  const supabase = await createClient()

  // Try to get the most recent conversation
  const { data: conversations } = await supabase
    .from('conversations')
    .select('*')
    .eq('student_id', studentId)
    .order('updated_at', { ascending: false })
    .limit(1)

  // If recent conversation exists (within last 24 hours), return it
  if (conversations && conversations.length > 0) {
    const lastConvo = conversations[0]
    const lastUpdate = new Date(lastConvo.updated_at)
    const now = new Date()
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60)

    if (hoursSinceUpdate < 24) {
      return lastConvo
    }
  }

  // Create new conversation
  const student = await getStudentById(studentId)
  if (!student) return null

  const { data: newConvo, error } = await supabase
    .from('conversations')
    .insert({
      student_id: studentId,
      checkpoint_context: student.current_checkpoint,
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating conversation:', error)
    return null
  }

  return newConvo
}
