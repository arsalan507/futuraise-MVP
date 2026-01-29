/**
 * AGENT 02: GROUNDING AGENT
 * TG Guardian - Ensures everything stays focused on Grades 6-8
 */

import { validateWithClaude } from '../claude-service'

export class GroundingAgent {
  name = 'Grounding Agent'
  alias = 'TG Guardian'
  tier = 'Governance'
  priority = 'CRITICAL'

  private readonly TARGET_GRADES = [6, 7, 8]
  private readonly TARGET_AGES = { min: 11, max: 14 }

  /**
   * Validate if feature aligns with target group
   */
  async validateTargetGroupAlignment(
    featureName: string,
    description: string
  ): Promise<{
    approved: boolean
    score: number
    feedback: string
    issues: string[]
    recommendations: string[]
  }> {
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
      `Feature: ${featureName}\n\nDescription: ${description}`,
      criteria
    )

    return {
      approved: validation.isValid && validation.score >= 80,
      score: validation.score,
      feedback: validation.feedback,
      issues: validation.recommendations.filter(r => r.toLowerCase().includes('issue')),
      recommendations: validation.recommendations
    }
  }

  /**
   * Review content for age-appropriateness
   */
  async reviewContent(
    content: string,
    contentType: 'lesson' | 'prompt' | 'ui' | 'message' | 'video'
  ): Promise<{
    approved: boolean
    readingLevel: number // grade level
    issues: string[]
    suggestions: string[]
  }> {
    const validation = await validateWithClaude(content, [
      'Language complexity matches Grade 6-8 reading level',
      'No concepts beyond Grade 8 cognitive ability',
      'Assumes no prior technical knowledge',
      'Uses relatable examples for 11-14 year olds',
      'Avoids condescending or overly childish tone',
      'No mature themes or inappropriate content'
    ])

    return {
      approved: validation.isValid,
      readingLevel: 7, // TODO: Calculate actual reading level
      issues: validation.recommendations.filter(r => r.toLowerCase().includes('issue')),
      suggestions: validation.recommendations.filter(r => !r.toLowerCase().includes('issue'))
    }
  }

  /**
   * Flag scope creep
   */
  async flagScopeCreep(proposal: string): Promise<{
    isScopeCreep: boolean
    reason: string
    severity: 'low' | 'medium' | 'high'
  }> {
    const lower = proposal.toLowerCase()

    // Check for expansion beyond TG
    const expandsBeyondTG =
      lower.includes('grade 9') ||
      lower.includes('grade 10') ||
      lower.includes('high school') ||
      lower.includes('adult') ||
      lower.includes('grade 4') ||
      lower.includes('grade 5')

    // Check for feature bloat
    const featureBloat =
      lower.includes('enterprise') ||
      lower.includes('advanced analytics') ||
      lower.includes('admin dashboard')

    if (expandsBeyondTG) {
      return {
        isScopeCreep: true,
        reason: 'Proposal expands beyond Grades 6-8 target group',
        severity: 'high'
      }
    }

    if (featureBloat) {
      return {
        isScopeCreep: true,
        reason: 'Feature adds complexity beyond MVP needs',
        severity: 'medium'
      }
    }

    return {
      isScopeCreep: false,
      reason: 'Proposal aligns with TG and MVP scope',
      severity: 'low'
    }
  }

  /**
   * Get target group persona
   */
  getTGPersona() {
    return {
      grades: this.TARGET_GRADES,
      ageRange: this.TARGET_AGES,
      cognitiveStage: 'Concrete Operational → Formal Operational transition',
      psychographics: {
        desires: [
          'Peer respect and recognition',
          'Hands-on, immediate results',
          'Feel smart and capable',
          'Create things friends will see',
          'Gain independence from parents'
        ],
        fears: [
          'Looking dumb in front of peers',
          'Boring, lecture-style learning',
          'Too much reading without action',
          'Being treated like a little kid'
        ],
        learningStyle: 'Learn by doing, need immediate feedback, want social validation'
      },
      capabilities: {
        canLearn: [
          'Prompt engineering basics',
          'Using no-code AI tools (ChatGPT, Zapier)',
          'Problem identification and validation',
          'Basic logic and if-then thinking',
          'Testing and iteration',
          'Following step-by-step guides'
        ],
        struggles: [
          'Abstract concepts without examples',
          'Reading lengthy documentation',
          'Advanced math or algorithms',
          'Long-term planning without milestones',
          'Self-directed learning without guidance',
          'Coding from scratch'
        ]
      },
      motivators: [
        'Seeing something work immediately',
        'Helping someone they care about',
        'Sharing wins with friends',
        'Earning badges/recognition',
        'Building something unique'
      ]
    }
  }

  /**
   * Challenge decision if it doesn't fit TG
   */
  async challengeDecision(
    decision: string,
    justification: string
  ): Promise<{
    challenge: boolean
    reason: string
    alternativeApproach?: string
  }> {
    // Grounding agent has veto power for TG misalignment
    const alignment = await this.validateTargetGroupAlignment(
      decision,
      justification
    )

    if (!alignment.approved) {
      return {
        challenge: true,
        reason: alignment.feedback,
        alternativeApproach: alignment.recommendations[0]
      }
    }

    return {
      challenge: false,
      reason: 'Decision aligns with target group'
    }
  }
}

// Singleton instance
export const groundingAgent = new GroundingAgent()
