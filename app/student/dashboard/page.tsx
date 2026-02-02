'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChatInterface } from '@/components/chat/chat-interface'
import { ProgressTracker } from '@/components/dashboard/progress-tracker'
import { StatsCard } from '@/components/dashboard/stats-card'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { calculateProgress, getCurrentWeek } from '@/lib/checkpoints/checkpoint-manager'
import { Target, Lightbulb, Wrench } from 'lucide-react'

interface Student {
  id: string
  user_id: string
  name: string
  email: string
  grade: number
  current_checkpoint: string
  target_person: string | null
  problem_statement: string | null
  problem_description: string | null
  solution_type: string | null
  primary_tool: string | null
  tools_used: string[] | null
  build_progress: string | null
  created_at: string
  updated_at: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function StudentDashboard() {
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [conversationMessages, setConversationMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const fetchStudentData = async () => {
      try {
        // Check if user is authenticated
        const token = localStorage.getItem('authToken')
        console.log('Token from localStorage:', token ? 'EXISTS' : 'MISSING')

        if (!token) {
          console.log('No token found, redirecting to login')
          router.push('/auth/login')
          return
        }

        // Fetch student data
        console.log('Fetching student data from /api/student/me')
        const response = await fetch('/api/student/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        console.log('API response status:', response.status)

        if (!response.ok) {
          if (response.status === 401) {
            // Token invalid or expired
            console.log('401 Unauthorized - clearing token and redirecting')
            localStorage.removeItem('authToken')
            localStorage.removeItem('user')
            router.push('/auth/login')
            return
          }
          throw new Error('Failed to load student data')
        }

        const data = await response.json()
        console.log('Student data loaded:', data.student)
        console.log('Conversation messages:', data.conversation?.messages?.length || 0)
        setStudent(data.student)
        setConversationMessages(data.conversation?.messages || [])
      } catch (err: any) {
        console.error('Error loading student data:', err)
        setError(err.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [router, mounted])

  const handleSignOut = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-600 mb-4">{error || 'Failed to load dashboard'}</p>
          <Button onClick={() => router.push('/auth/login')}>
            Back to Login
          </Button>
        </div>
      </div>
    )
  }

  // Calculate stats
  const progress = calculateProgress(student.current_checkpoint)
  const currentWeek = getCurrentWeek(student.current_checkpoint)
  const daysActive = Math.floor(
    (new Date().getTime() - new Date(student.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FuturAIse
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="text-2xl">🔥</div>
                <span className="font-semibold">{daysActive} day streak</span>
              </div>
              <Button variant="ghost" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatsCard
            title="Current Week"
            value={currentWeek}
            icon={<Target size={32} />}
            description="of 3 weeks"
          />
          <StatsCard
            title="Progress"
            value={`${progress}%`}
            icon={<Lightbulb size={32} />}
            description="Journey completion"
          />
          <StatsCard
            title="Building"
            value={student.target_person ? student.target_person : 'Not Set'}
            icon={<Wrench size={32} />}
            description={student.problem_statement || 'Define your problem'}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Progress */}
          <div className="lg:col-span-1">
            <ProgressTracker currentCheckpoint={student.current_checkpoint} />
          </div>

          {/* Main Content - Chat */}
          <div className="lg:col-span-2">
            <Card className="p-0 h-[calc(100vh-200px)]">
              <ChatInterface
                studentId={student.id}
                checkpoint={student.current_checkpoint}
                initialMessages={conversationMessages}
                onMessageSent={(message) => {
                  console.log('Message sent:', message)
                }}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
