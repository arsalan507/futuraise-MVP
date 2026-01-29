// Claude Chat Service - The Heart of Max (AI Buddy)
import Anthropic from '@anthropic-ai/sdk'

// Types
export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export interface StudentContext {
  studentId: string
  studentName: string
  grade?: number
  currentCheckpoint: string
  currentWeek: number
  targetPerson?: string
  problemStatement?: string
  problemDescription?: string
  solutionType?: string
  toolsUsed?: string[]
  buildProgress?: string
  conversationHistory: Message[]
}

export interface ChatResponse {
  message: string
  shouldAdvanceCheckpoint: boolean
  extractedData?: Record<string, any>
  suggestedActions?: string[]
}

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Main chat function
export async function chatWithMax(
  userMessage: string,
  context: StudentContext
): Promise<ChatResponse> {
  const systemPrompt = buildSystemPrompt(context)

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        ...context.conversationHistory.slice(-20).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })),
        { role: 'user', content: userMessage }
      ],
    })

    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : ''

    // Analyze response for checkpoint advancement
    const analysis = analyzeResponse(userMessage, assistantMessage, context)

    return {
      message: assistantMessage,
      shouldAdvanceCheckpoint: analysis.shouldAdvance,
      extractedData: analysis.extractedData,
      suggestedActions: analysis.suggestedActions
    }
  } catch (error) {
    console.error('Claude API Error:', error)
    throw new Error('Failed to get response from Max')
  }
}

// Build system prompt based on context
function buildSystemPrompt(context: StudentContext): string {
  const stageGuidelines = getStageGuidelines(context.currentCheckpoint)
  const contextInfo = buildContextInfo(context)

  return `You are Max, an enthusiastic AI building mentor for ${context.studentName || 'a student'}, a middle schooler (grades 6-8, ages 11-14).

${contextInfo}

YOUR PERSONALITY:
- Friendly peer, NOT a formal teacher
- Use simple language appropriate for 11-14 year olds
- Keep responses SHORT (2-4 sentences max, unless explaining steps)
- Use emojis sparingly but warmly (1-2 per message max)
- Celebrate every small win genuinely
- Never be condescending or patronizing
- Be patient when they're confused

YOUR CURRENT ROLE (${context.currentCheckpoint}):
${stageGuidelines}

IMPORTANT RULES:
1. Ask ONE question at a time - don't overwhelm them
2. Give HINTS, not answers - guide them to discover
3. If they seem stuck 3+ times, offer to simplify or get human help
4. Always relate back to THEIR specific problem/person
5. Make them feel like they're building something REAL and important
6. When they complete a stage, celebrate and naturally transition to next

Remember: They're creating something a real person will use every day. This matters!`
}

// Build context information string
function buildContextInfo(context: StudentContext): string {
  const parts = [
    `CURRENT STATE:`,
    `- Week: ${context.currentWeek}/3`,
    `- Checkpoint: ${context.currentCheckpoint}`,
  ]

  if (context.targetPerson) {
    parts.push(`- Target Person: ${context.targetPerson}`)
  }
  if (context.problemStatement) {
    parts.push(`- Problem: "${context.problemStatement}"`)
  }
  if (context.solutionType) {
    parts.push(`- Solution Type: ${context.solutionType}`)
  }
  if (context.toolsUsed?.length) {
    parts.push(`- Tools: ${context.toolsUsed.join(', ')}`)
  }
  if (context.buildProgress) {
    parts.push(`- Build Progress: ${context.buildProgress}`)
  }

  return parts.join('\n')
}

// Get stage-specific guidelines
function getStageGuidelines(checkpoint: string): string {
  const guidelines: Record<string, string> = {
    welcome: `
GOAL: Welcome them and get them excited about building something real.
- Introduce yourself warmly
- Explain the journey (3 weeks, real solution)
- Ask who they want to help (parent, friend, sibling, teacher, self)
- Move to next checkpoint when they choose a person`,

    target_identified: `
GOAL: Help them identify a real, daily problem their target person faces.
- Ask what stresses/annoys their chosen person EVERY DAY
- Dig deeper with follow-up questions
- Look for frequency (daily is best), frustration level, and attempted solutions
- Move to next checkpoint when problem is clearly described`,

    problem_discovered: `
GOAL: Validate if this problem is good for an AI solution.
- Ask clarifying questions about the problem
- Check: Is it recurring? Frustrating? Can AI help? Can they build it?
- Help them write a clear problem statement
- Move to next checkpoint when problem is validated as AI-solvable`,

    problem_validated: `
GOAL: Help them choose a solution type and tools.
- Present 3 options based on their problem:
  1. Chatbot (ChatGPT Custom GPT) - for advice/answers/conversation
  2. Automation (Zapier) - for reminders/organization/workflows
  3. Generator (ChatGPT prompts) - for creating content/documents
- Explain each option simply
- Help them choose the best fit
- Move to next checkpoint when solution type is chosen`,

    solution_designed: `
GOAL: Guide them to start building.
- Give step-by-step instructions for their chosen tool
- Start with account creation/setup
- Be very specific ("Click the button that says...")
- Celebrate each completed step
- Move to next checkpoint when they've completed first build step`,

    building_started: `
GOAL: Help them complete their working prototype.
- Continue step-by-step guidance
- Help debug issues ("What do you see on screen?")
- Encourage testing along the way
- Move to next checkpoint when solution works`,

    prototype_working: `
GOAL: Help them deploy to their target person.
- Give them a "handoff script" to introduce their creation
- Explain how to share access (link, app, etc.)
- Suggest they watch the person use it first time
- Move to next checkpoint when target person has access`,

    deployed: `
GOAL: Help them collect feedback and iterate.
- Ask how many times the person used it
- What feedback did they get?
- Help them make one improvement based on feedback
- Move to next checkpoint after 3+ days of usage data`,

    feedback_collected: `
GOAL: Help them create a portfolio of their project.
- Ask questions to fill in portfolio sections
- Help them write professionally (you'll polish their answers)
- Sections: Problem, Solution, Impact, Skills Learned
- Help record/describe a demo
- Move to next checkpoint when portfolio is complete`,

    portfolio_created: `
GOAL: Celebrate completion and introduce next steps.
- Massive celebration! They built something real!
- Summarize their journey and achievements
- Introduce the concept of going deeper (high-ticket hint)
- Ask if they want to build something new`,

    completed: `
GOAL: They've finished! Keep them engaged.
- Celebrate their achievement
- Suggest sharing their portfolio
- Mention advanced opportunities
- Encourage them to help others`
  }

  return guidelines[checkpoint] || guidelines.welcome
}

// Analyze response for checkpoint advancement and data extraction
function analyzeResponse(
  userMessage: string,
  assistantMessage: string,
  context: StudentContext
): {
  shouldAdvance: boolean
  extractedData?: Record<string, any>
  suggestedActions?: string[]
} {
  const lowerMessage = userMessage.toLowerCase()
  const extractedData: Record<string, any> = {}
  let shouldAdvance = false
  const suggestedActions: string[] = []

  switch (context.currentCheckpoint) {
    case 'welcome':
      // Check if they selected a target person
      if (lowerMessage.includes('parent') || lowerMessage.includes('mom') || lowerMessage.includes('dad')) {
        extractedData.targetPerson = 'parent'
        shouldAdvance = true
      } else if (lowerMessage.includes('friend')) {
        extractedData.targetPerson = 'friend'
        shouldAdvance = true
      } else if (lowerMessage.includes('sibling') || lowerMessage.includes('brother') || lowerMessage.includes('sister')) {
        extractedData.targetPerson = 'sibling'
        shouldAdvance = true
      } else if (lowerMessage.includes('teacher')) {
        extractedData.targetPerson = 'teacher'
        shouldAdvance = true
      } else if (lowerMessage.includes('myself') || lowerMessage.includes('self') || lowerMessage.includes('me')) {
        extractedData.targetPerson = 'self'
        shouldAdvance = true
      }
      break

    case 'target_identified':
      // Check if they described a problem (message longer than 20 chars usually means description)
      if (userMessage.length > 20 && !lowerMessage.includes('?')) {
        extractedData.problemDescription = userMessage
        // Don't auto-advance, let Claude validate
      }
      break

    case 'problem_discovered':
      // Check for problem validation signals in Claude's response
      if (assistantMessage.toLowerCase().includes('perfect') ||
          assistantMessage.toLowerCase().includes('great problem') ||
          assistantMessage.toLowerCase().includes('problem statement')) {
        shouldAdvance = true
        extractedData.problemValidated = true
      }
      break

    case 'problem_validated':
      // Check if they chose a solution type
      if (lowerMessage.includes('chatbot') || lowerMessage.includes('option 1') || lowerMessage.includes('gpt')) {
        extractedData.solutionType = 'chatbot'
        extractedData.primaryTool = 'ChatGPT Custom GPT'
        shouldAdvance = true
      } else if (lowerMessage.includes('automation') || lowerMessage.includes('option 2') || lowerMessage.includes('zapier')) {
        extractedData.solutionType = 'automation'
        extractedData.primaryTool = 'Zapier'
        shouldAdvance = true
      } else if (lowerMessage.includes('generator') || lowerMessage.includes('option 3')) {
        extractedData.solutionType = 'generator'
        extractedData.primaryTool = 'ChatGPT Prompts'
        shouldAdvance = true
      }
      break

    case 'solution_designed':
      // Check for build start signals
      if (lowerMessage.includes('done') || lowerMessage.includes('ready') ||
          lowerMessage.includes('created') || lowerMessage.includes('made')) {
        extractedData.buildStarted = true
        shouldAdvance = true
      }
      break

    case 'building_started':
      // Check for prototype completion
      if (lowerMessage.includes('works') || lowerMessage.includes('working') ||
          lowerMessage.includes('it works') || lowerMessage.includes('done')) {
        if (assistantMessage.toLowerCase().includes('works') ||
            assistantMessage.toLowerCase().includes('amazing') ||
            assistantMessage.toLowerCase().includes('congratulations')) {
          extractedData.prototypeComplete = true
          shouldAdvance = true
        }
      }
      break

    case 'prototype_working':
      // Check for deployment signals
      if (lowerMessage.includes('gave') || lowerMessage.includes('showed') ||
          lowerMessage.includes('shared') || lowerMessage.includes('using')) {
        extractedData.deployed = true
        shouldAdvance = true
      }
      break

    case 'deployed':
      // Check for feedback collection
      if ((lowerMessage.includes('used') || lowerMessage.includes('times')) &&
          (lowerMessage.includes('said') || lowerMessage.includes('feedback') || lowerMessage.includes('loves'))) {
        extractedData.feedbackCollected = true
        shouldAdvance = true
      }
      break

    case 'feedback_collected':
      // Check for portfolio completion
      if (assistantMessage.toLowerCase().includes('portfolio') &&
          (assistantMessage.toLowerCase().includes('complete') ||
           assistantMessage.toLowerCase().includes('done') ||
           assistantMessage.toLowerCase().includes('amazing'))) {
        extractedData.portfolioComplete = true
        shouldAdvance = true
      }
      break

    case 'portfolio_created':
      // Journey complete!
      shouldAdvance = true
      extractedData.journeyComplete = true
      break
  }

  return { shouldAdvance, extractedData, suggestedActions }
}

// Get initial welcome message based on checkpoint
export function getInitialMessage(checkpoint: string, studentName?: string): string {
  const name = studentName || 'there'

  const messages: Record<string, string> = {
    welcome: `Hey ${name}! I'm Max 👋

I'm your AI building buddy. Over the next 3 weeks, you and I are going to build something EPIC - an AI tool that solves a real problem for someone you care about.

Not a practice project. Not homework. A REAL solution that someone will actually use every day.

Ready? Let's start!

Who do you want to help?
🏠 Your parent
👥 A friend
👨‍👩‍👧 A sibling
🎓 A teacher
😊 Yourself`,

    target_identified: `Welcome back, ${name}!

Let's continue discovering the perfect problem to solve. Tell me about your person - what's something that stresses them out or annoys them EVERY DAY?`,

    problem_discovered: `Hey ${name}!

Let's validate your problem and make sure it's perfect for an AI solution. Tell me more about what you discovered!`,

    problem_validated: `Awesome, ${name}!

Your problem is validated - now let's design the perfect solution! I'll show you some options.`,

    solution_designed: `Let's build, ${name}! 🔨

You've chosen your solution type. Now I'll guide you step by step to create it. Ready to start?`,

    building_started: `Keep going, ${name}! 💪

You're making progress on your build. Let's continue where you left off!`,

    prototype_working: `Amazing work, ${name}! 🎉

Your prototype is working! Now it's time to give it to your person and see it in action.`,

    deployed: `How's it going, ${name}?

Your solution is out there being used! Tell me about the feedback you're getting.`,

    feedback_collected: `Portfolio time, ${name}! 📝

Let's document this incredible thing you built. I'll help you create a professional portfolio.`,

    portfolio_created: `You did it, ${name}! 🏆

Your journey is complete. You're now officially an AI Problem Solver!`,

    completed: `Welcome back, ${name}! 🌟

Amazing to see you again! Ready to build something new?`
  }

  return messages[checkpoint] || messages.welcome
}
