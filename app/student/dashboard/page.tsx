import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatInterface } from '@/components/chat/chat-interface'
import { ProgressTracker } from '@/components/dashboard/progress-tracker'
import { StatsCard } from '@/components/dashboard/stats-card'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { calculateProgress, getCurrentWeek } from '@/lib/checkpoints/checkpoint-manager'
import { Target, Lightbulb, Wrench } from 'lucide-react'

export default async function StudentDashboard() {
  const supabase = await createClient()

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Get student data
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (studentError || !student) {
    redirect('/auth/signup')
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
              <form action="/api/auth/signout" method="post">
                <Button variant="ghost" type="submit">Sign Out</Button>
              </form>
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
