'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Award, Target, Lightbulb, Wrench, Quote } from 'lucide-react'

interface Portfolio {
  student_name: string
  title: string
  problem_statement: string
  problem_description: string
  target_person: string
  solution_type: string
  tools_used: string[]
  impact_story: string
  user_testimonial: string
  demo_video_url: string
  created_at: string
}

export default function PublicPortfolioPage() {
  const params = useParams()
  const studentId = params.studentId as string
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPortfolio()
  }, [studentId])

  const fetchPortfolio = async () => {
    try {
      const response = await fetch(`/api/portfolio/${studentId}`)

      if (!response.ok) {
        throw new Error('Portfolio not found or not published')
      }

      const data = await response.json()
      setPortfolio(data.portfolio)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading portfolio...</p>
        </div>
      </div>
    )
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold mb-2">Portfolio Not Found</h2>
          <p className="text-gray-600">
            {error || 'This portfolio may not be published yet or does not exist.'}
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-blue-500">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="flex justify-center mb-4">
            <Award className="text-blue-600" size={48} />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {portfolio.student_name}'s Project
          </h1>
          <p className="text-xl text-gray-700 font-medium">{portfolio.title}</p>
          <p className="text-sm text-gray-500 mt-2">
            Built with FuturAIse · {new Date(portfolio.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Problem */}
        <Card className="p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <Target className="text-red-600" size={28} />
            </div>
            <h2 className="text-2xl font-bold">The Problem</h2>
          </div>
          <p className="text-lg text-gray-700 mb-4">{portfolio.problem_statement}</p>
          {portfolio.problem_description && (
            <p className="text-gray-600">{portfolio.problem_description}</p>
          )}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Helping:</span> {portfolio.target_person}
            </p>
          </div>
        </Card>

        {/* Solution */}
        <Card className="p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Lightbulb className="text-blue-600" size={28} />
            </div>
            <h2 className="text-2xl font-bold">The Solution</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">Solution Type</p>
              <p className="text-lg font-semibold capitalize">{portfolio.solution_type}</p>
            </div>
            {portfolio.tools_used && portfolio.tools_used.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Tools Used</p>
                <div className="flex flex-wrap gap-2">
                  {portfolio.tools_used.map((tool, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Impact */}
        <Card className="p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Wrench className="text-green-600" size={28} />
            </div>
            <h2 className="text-2xl font-bold">The Impact</h2>
          </div>
          <p className="text-lg text-gray-700 leading-relaxed">{portfolio.impact_story}</p>
        </Card>

        {/* Testimonial */}
        {portfolio.user_testimonial && (
          <Card className="p-8 mb-6 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <Quote className="text-purple-600" size={28} />
              <h2 className="text-2xl font-bold">What They Said</h2>
            </div>
            <p className="text-lg italic text-gray-700">"{portfolio.user_testimonial}"</p>
          </Card>
        )}

        {/* Demo Video */}
        {portfolio.demo_video_url && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">Demo Video</h2>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <iframe
                className="w-full h-full rounded-lg"
                src={portfolio.demo_video_url.replace('watch?v=', 'embed/')}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            This project was built as part of the <span className="font-semibold text-blue-600">FuturAIse</span> program
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Where middle schoolers build real AI solutions for real people
          </p>
        </div>
      </div>
    </div>
  )
}
