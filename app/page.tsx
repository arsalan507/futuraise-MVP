import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Build AI Solutions That Matter
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Not a course. Not homework. Build real AI tools that solve actual problems for people you care about.
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center mb-16">
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Start Building (₹499)
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition"
            >
              Login
            </Link>
          </div>

          {/* How It Works */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2">Find a Problem</h3>
              <p className="text-gray-600">
                Claude helps you discover a real problem someone you know faces every day
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🔨</div>
              <h3 className="text-xl font-bold mb-2">Build a Solution</h3>
              <p className="text-gray-600">
                Claude guides you step-by-step to build an AI tool that solves it
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-2">Deploy & Showcase</h3>
              <p className="text-gray-600">
                Give it to them, watch them use it, add it to your portfolio
              </p>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-16 bg-white p-8 rounded-xl shadow-lg">
            <p className="text-gray-600 italic mb-4">
              "My daughter built an AI assistant that helps me remember my medications. I use it every single day!"
            </p>
            <p className="font-semibold">- Parent of Grade 7 student</p>
          </div>
        </div>
      </div>
    </div>
  )
}
