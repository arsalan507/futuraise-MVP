'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Award, Share2, ExternalLink } from 'lucide-react'

export default function PortfolioPage() {
  const router = useRouter()
  const [portfolio, setPortfolio] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [impactStory, setImpactStory] = useState('')
  const [userTestimonial, setUserTestimonial] = useState('')
  const [demoVideoUrl, setDemoVideoUrl] = useState('')
  const [isPublished, setIsPublished] = useState(false)

  useEffect(() => {
    fetchPortfolio()
  }, [])

  const fetchPortfolio = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/portfolio', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setPortfolio(data.portfolio)
        setImpactStory(data.portfolio.impact_story || '')
        setUserTestimonial(data.portfolio.user_testimonial || '')
        setDemoVideoUrl(data.portfolio.demo_video_url || '')
        setIsPublished(data.portfolio.portfolio_published || false)
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (publish: boolean = false) => {
    setSaving(true)
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          impact_story: impactStory,
          user_testimonial: userTestimonial,
          demo_video_url: demoVideoUrl,
          portfolio_published: publish
        })
      })

      if (response.ok) {
        setIsPublished(publish)
        alert(publish ? 'Portfolio published!' : 'Portfolio saved!')
        fetchPortfolio()
      }
    } catch (error) {
      console.error('Error saving portfolio:', error)
      alert('Failed to save portfolio')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading your portfolio...</p>
        </div>
      </div>
    )
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="text-4xl mb-4">📝</div>
          <h2 className="text-xl font-bold mb-2">No Project Yet</h2>
          <p className="text-gray-600 mb-4">
            Complete your project first, then come back to create your portfolio!
          </p>
          <Button onClick={() => router.push('/student/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="text-blue-600" size={32} />
              <div>
                <h1 className="text-2xl font-bold">My Portfolio</h1>
                <p className="text-sm text-gray-600">Showcase your amazing project</p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => router.push('/student/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Project Overview */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Your Project</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Project Title</p>
              <p className="font-semibold">{portfolio.title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Helping</p>
              <p className="font-semibold">{portfolio.target_person}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Problem</p>
              <p className="font-semibold">{portfolio.problem_statement}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Solution Type</p>
              <p className="font-semibold capitalize">{portfolio.solution_type}</p>
            </div>
          </div>
        </Card>

        {/* Portfolio Content */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Portfolio Content</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Impact Story
              </label>
              <p className="text-sm text-gray-600 mb-2">
                How did your solution help? What changed?
              </p>
              <textarea
                className="w-full min-h-[120px] p-3 border rounded-lg"
                placeholder="Example: My chatbot helped my mom save 30 minutes every day by answering common questions automatically. She says it's like having a helpful assistant!"
                value={impactStory}
                onChange={(e) => setImpactStory(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Testimonial (Optional)
              </label>
              <p className="text-sm text-gray-600 mb-2">
                What did the person you helped say about it?
              </p>
              <textarea
                className="w-full min-h-[100px] p-3 border rounded-lg"
                placeholder="Example: 'This is so helpful! I use it every day.' - Mom"
                value={userTestimonial}
                onChange={(e) => setUserTestimonial(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Demo Video URL (Optional)
              </label>
              <p className="text-sm text-gray-600 mb-2">
                Link to a video showing your project in action
              </p>
              <Input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={demoVideoUrl}
                onChange={(e) => setDemoVideoUrl(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-between">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            Save Draft
          </Button>

          <div className="flex gap-4">
            {isPublished && portfolio.portfolio_url && (
              <Button
                variant="outline"
                onClick={() => window.open(portfolio.portfolio_url, '_blank')}
              >
                <ExternalLink size={18} className="mr-2" />
                View Public Portfolio
              </Button>
            )}

            <Button
              onClick={() => handleSave(true)}
              disabled={saving || !impactStory}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Share2 size={18} className="mr-2" />
              {isPublished ? 'Update Published Portfolio' : 'Publish Portfolio'}
            </Button>
          </div>
        </div>

        {!impactStory && (
          <p className="text-sm text-gray-600 mt-4 text-center">
            Fill in the Impact Story to publish your portfolio
          </p>
        )}
      </div>
    </div>
  )
}
