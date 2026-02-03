'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Users, CheckCircle, Clock } from 'lucide-react'

interface Intervention {
  id: string
  student_id: string
  student_name: string
  checkpoint: string
  reason: string
  status: string
  created_at: string
  context: any
}

interface StudentSummary {
  id: string
  name: string
  email: string
  current_checkpoint: string
  progress: number
  last_active: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [students, setStudents] = useState<StudentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        router.push('/admin/login')
        return
      }

      // Fetch interventions and students
      const [interventionsRes, studentsRes] = await Promise.all([
        fetch('/api/admin/interventions', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/students', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (!interventionsRes.ok || !studentsRes.ok) {
        throw new Error('Failed to load dashboard data')
      }

      const interventionsData = await interventionsRes.json()
      const studentsData = await studentsRes.json()

      setInterventions(interventionsData.interventions || [])
      setStudents(studentsData.students || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/admin/login')}>Back to Login</Button>
        </div>
      </div>
    )
  }

  const pendingInterventions = interventions.filter(i => i.status === 'pending')
  const totalStudents = students.length
  const activeStudents = students.filter(s => {
    const lastActive = new Date(s.last_active)
    const daysSince = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    return daysSince < 7
  }).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <Button variant="ghost" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Interventions</p>
                <p className="text-2xl font-bold">{pendingInterventions.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active (7 days)</p>
                <p className="text-2xl font-bold">{activeStudents}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Progress</p>
                <p className="text-2xl font-bold">
                  {students.length > 0
                    ? Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length)
                    : 0}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Interventions */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Students Needing Help</h2>
            {pendingInterventions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending interventions</p>
            ) : (
              <div className="space-y-3">
                {pendingInterventions.map(intervention => (
                  <div key={intervention.id} className="border rounded-lg p-4 bg-red-50 border-red-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{intervention.student_name}</h3>
                        <p className="text-sm text-gray-600">{intervention.checkpoint}</p>
                      </div>
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                        Needs Help
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{intervention.reason}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(intervention.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Students List */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Student Progress</h2>
            {students.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No students enrolled</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {students.map(student => (
                  <div key={student.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{student.name}</h3>
                        <p className="text-sm text-gray-600">{student.email}</p>
                      </div>
                      <span className="text-sm font-medium text-blue-600">
                        {student.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${student.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Checkpoint: {student.current_checkpoint}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
