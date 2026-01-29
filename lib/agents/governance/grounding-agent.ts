// AGENT 02: Grounding Agent - TG Guardian (Grades 6-8 Focus Enforcer)
import { AgentContext, AgentResponse, DecisionResult } from '../types'
import { validateWithClaude } from '../claude-service'

export class GroundingAgent {
  private readonly TARGET_GRADES = [6, 7, 8]
  private readonly TARGET_AGES = { min: 11, max: 14 }

  async validateTargetGroupAlignment(
    feature: string,
    description: string,
    agentContext: AgentContext
  ): Promise<DecisionResult> {
    const criteria = [
      'Is this specifically designed for ages 11-14?',
      'Does it match Grades 6-8 cognitive development level?',
      'Would a 12-year-old understand this without adult help?',
      'Does it address documented pain points for this age group?',
      'Is the language and tone appropriate for middle schoolers?',
      'Does it align with their psychographics (peer respect, hands-on, visible results)?',
      'Would this distract from the core problem-solving journey?',
      'Is this in the research-validated "CAN learn" category for this age?'
    ]

    const validation = await validateWithClaude(
      `Feature: ${feature}\n\nDescription: ${description}`,
      criteria
    )

    return {
      decision: validation.isValid && validation.score >= 80 ? 'approve' : 'reject',
      reason: validation.feedback,
      confidence: validation.score,
      recommendations: validation.recommendations
    }
  }

  async reviewContent(
    content: string,
    contentType: 'lesson' | 'prompt' | 'ui' | 'message'
  ): Promise<{ approved: boolean; issues: string[]; suggestions: string[] }> {
    const ageAppropriateness = await validateWithClaude(content, [
      'Language complexity matches Grade 6-8 reading level',
      'No concepts beyond Grade 8 cognitive ability',
      'Assumes no prior technical knowledge',
      'Uses relatable examples for 11-14 year olds',
      'Avoids condescending or overly childish tone'
    ])

    return {
      approved: ageAppropriateness.isValid,
      issues: ageAppropriateness.recommendations.filter(r => r.includes('Issue')),
      suggestions: ageAppropriateness.recommendations.filter(r => !r.includes('Issue'))
    }
  }

  async flagScopeCreep(
    proposal: string,
    currentScope: string[]
  ): Promise<{ isScopeCreep: boolean; reason: string }> {
    // Check if proposal expands beyond TG
    const expandsBeyondTG =
      proposal.toLowerCase().includes('grade 9') ||
      proposal.toLowerCase().includes('grade 10') ||
      proposal.toLowerCase().includes('adult') ||
      proposal.toLowerCase().includes('grade 4') ||
      proposal.toLowerCase().includes('grade 5')

    return {
      isScopeCreep: expandsBeyondTG,
      reason: expandsBeyondTG
        ? 'Proposal expands beyond Grades 6-8 target group'
        : 'Proposal aligns with TG'
    }
  }

  async getTGPersona(): Promise<any> {
    return {
      targetGrades: this.TARGET_GRADES,
      ageRange: this.TARGET_AGES,
      cognitiveStage: 'Concrete Operational to Formal Operational transition',
      psychographics: {
        desires: [
          'Peer respect and recognition',
          'Hands-on, immediate results',
          'Feel smart and capable',
          'Create things friends will see',
          'Gain independence'
        ],
        fears: [
          'Looking dumb in front of friends',
          'Boring, lecture-style learning',
          'Too much reading/theory',
          'Feeling like a little kid'
        ],
        learningStyle: 'Learn by doing, need immediate feedback, want social validation'
      },
      capabilities: {
        canLearn: [
          'Prompt engineering basics',
          'Using no-code AI tools',
          'Problem identification',
          'Basic logic and if-then thinking',
          'Testing and iteration'
        ],
        struggles: [
          'Abstract concepts without examples',
          'Reading lengthy text',
          'Advanced math/algorithms',
          'Long-term planning without milestones',
          'Self-directed learning without guidance'
        ]
      }
    }
  }
}

export const groundingAgent = new GroundingAgent()
