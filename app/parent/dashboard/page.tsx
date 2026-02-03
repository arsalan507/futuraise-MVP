'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProgressTracker } from '@/components/dashboard/progress-tracker'
import { Target, Lightbulb, Wrench, AlertCircle, CheckCircle } from 'lucide-react'

interface ChildData {
  student: {
    id: string
    name: string
    email: string
    grade: number
    current_checkpoint: string
    target_person: string | null
    problem_statement: string | null
    solution_type: string | null
    primary_tool: string | null
    created_at: string
  }
  progress: {
    percent_complete: number
    current_week: number
    days_active: number
  }
  project: {
    title: string
    problem_statement: string
    target_person: string
    solution_type: string
    status: string
  } | null
  needs_help: boolean
}

export default function ParentDashboard() {
  const router = useRouter()
  const [childData, setChildData] = useState<ChildData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchChildData()
  }, [])

  const fetchChildData = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        router.push('/parent/login')
        return
      }

      const response = await fetch('/api/parent/child', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/parent/login')
          return
        }
        throw new Error('Failed to load child data')
      }

      const data = await response.json()
      setChildData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    router.push('/parent/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !childData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-600 mb-4">{error || 'Failed to load data'}</p>
          <Button onClick={() => router.push('/parent/login')}>Back to Login</Button>
        </div>
      </div>
    )
  }

  const { student, progress, project, needs_help } = childData

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                {student.name}'s Journey
              </h1>
              <p className="text-sm text-gray-600">Parent Dashboard</p>
            </div>
            <Button variant="ghost" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Alert if child needs help */}
        {needs_help && (
          <Card className="mb-6 p-4 bg-yellow-50 border-yellow-200 border-2">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-semibold text-yellow-800">Your child may need help</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  They've been working on the same checkpoint for a while. Consider checking in to see if they need assistance.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Week</p>
                <p className="text-2xl font-bold">Week {progress.current_week}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">of 3-week journey</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Lightbulb size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Progress</p>
                <p className="text-2xl font-bold">{progress.percent_complete}%</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Journey completion</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle size={24} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Days Active</p>
                <p className="text-2xl font-bold">{progress.days_active}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Learning streak</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Progress Tracker */}
          <div className="lg:col-span-1">
            <ProgressTracker currentCheckpoint={student.current_checkpoint} />
          </div>

          {/* Project Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Goal */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">What They're Building</h2>
              {student.target_person ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Helping</p>
                    <p className="font-semibold text-lg">{student.target_person}</p>
                  </div>
                  {student.problem_statement && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Problem</p>
                      <p className="font-semibold">{student.problem_statement}</p>
                    </div>
                  )}
                  {student.solution_type && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Solution Type</p>
                      <p className="font-semibold capitalize">{student.solution_type}</p>
                    </div>
                  )}
                  {student.primary_tool && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Building With</p>
                      <p className="font-semibold">{student.primary_tool}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">
                  Your child is just getting started! They're working with Max to identify a problem to solve.
                </p>
              )}
            </Card>

            {/* Project Status */}
            {project && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Project Status</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Project Title</p>
                    <p className="font-semibold">{project.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      project.status === 'completed' ? 'bg-green-100 text-green-700' :
                      project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {project.status === 'in_progress' ? 'Building' : project.status}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Encouragement */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-teal-50 border-green-200">
              <h3 className="font-semibold mb-2">Encourage Your Child</h3>
              <p className="text-sm text-gray-700">
                {progress.percent_complete < 25
                  ? "They're just getting started on an amazing journey! Ask them about the problem they're trying to solve."
                  : progress.percent_complete < 50
                  ? "Great progress! They're identifying real problems and designing solutions. Ask them to explain their idea to you."
                  : progress.percent_complete < 75
                  ? "Awesome work! They're building their solution now. Ask them to show you what they're creating!"
                  : "Almost there! They're finishing up and documenting their project. Ask to see their final creation!"}
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
