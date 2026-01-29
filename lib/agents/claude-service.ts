// Claude API Service - Powers all AI agents
import Anthropic from '@anthropic-ai/sdk'
import { ConversationMessage } from './types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface ClaudeCallOptions {
  systemPrompt: string
  messages: ConversationMessage[]
  maxTokens?: number
  temperature?: number
  model?: string
}

export async function callClaude(options: ClaudeCallOptions): Promise<string> {
  const {
    systemPrompt,
    messages,
    maxTokens = 1024,
    temperature = 0.7,
    model = 'claude-3-5-sonnet-20241022'
  } = options

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    })

    const content = response.content[0]
    return content.type === 'text' ? content.text : ''
  } catch (error) {
    console.error('Claude API Error:', error)
    throw new Error(`Failed to call Claude: ${error}`)
  }
}

// Specialized Claude calls for different agent types

export async function analyzeWithClaude(
  prompt: string,
  context: string
): Promise<any> {
  const systemPrompt = `You are an analytical AI assistant. Analyze the provided context and respond in JSON format.`

  const response = await callClaude({
    systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Context: ${context}\n\nTask: ${prompt}\n\nRespond in valid JSON format.`,
        timestamp: new Date()
      }
    ],
    temperature: 0.3 // Lower for more consistent analysis
  })

  try {
    return JSON.parse(response)
  } catch {
    return { raw: response }
  }
}

export async function validateWithClaude(
  item: string,
  criteria: string[]
): Promise<{ isValid: boolean; score: number; feedback: string; recommendations: string[] }> {
  const systemPrompt = `You are a validation expert. Evaluate items against given criteria.`

  const prompt = `Evaluate this item against the criteria:

Item: ${item}

Criteria:
${criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Respond in JSON format:
{
  "isValid": boolean,
  "score": number (0-100),
  "feedback": "explanation",
  "recommendations": ["suggestion 1", "suggestion 2"]
}`

  const response = await callClaude({
    systemPrompt,
    messages: [{ role: 'user', content: prompt, timestamp: new Date() }],
    temperature: 0.3
  })

  return JSON.parse(response)
}

export async function generateWithClaude(
  type: string,
  input: any
): Promise<string> {
  const systemPrompt = `You are a creative content generator. Generate high-quality ${type} based on the input provided.`

  const response = await callClaude({
    systemPrompt,
    messages: [
      {
        role: 'user',
        content: JSON.stringify(input),
        timestamp: new Date()
      }
    ],
    temperature: 0.8 // Higher for creativity
  })

  return response
}
