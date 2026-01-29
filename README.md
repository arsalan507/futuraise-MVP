# FuturAIse MVP - Conversation-Driven AI Building Platform

Build REAL AI solutions with Claude as your mentor. No courses, no videos - just building.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# (Fill in your Supabase and Anthropic API keys)

# Run migrations in Supabase dashboard

# Start development server
npm run dev
```

Visit http://localhost:3000

## What We Built

A conversation-driven platform where students:
- Chat with Max (Claude AI) as their mentor
- Build REAL AI solutions for people they care about
- Complete 9 checkpoints over 3 weeks
- Deploy working solutions and create portfolios

## Core Features

✅ **Real-time Chat with Claude** - AI-powered mentorship
✅ **9 Checkpoint System** - Structured 3-week journey
✅ **Progress Tracking** - Visual journey map
✅ **Auth System** - Student signup/login
✅ **Database** - Supabase with full schema
✅ **Responsive UI** - Works on mobile and desktop

## Tech Stack

- Next.js 14 + React + TypeScript
- Anthropic Claude 3.5 Sonnet
- Supabase (PostgreSQL + Auth)
- Tailwind CSS + shadcn/ui

## Setup Instructions

See full setup instructions in the project documentation.

## Project Structure

```
app/
├── api/chat/         # Claude chat API
├── auth/            # Login/Signup pages
├── student/         # Student dashboard
└── page.tsx         # Landing page

lib/
├── claude/          # Claude integration
├── checkpoints/     # Checkpoint system
├── student/         # Student data management
└── supabase/        # Database client

components/
├── chat/            # Chat interface
├── dashboard/       # Progress tracking UI
└── ui/              # UI components
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
ANTHROPIC_API_KEY=your_anthropic_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Deployment

Deploy to Vercel:
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

## Cost per Student

- Claude API: ~₹150-300 ($2-4) per student
- Supabase: Free (up to 500 students/month)
- Vercel: Free

Revenue: ₹499 per student
Margin: 40-60%

## License

Private - FuturAIse
