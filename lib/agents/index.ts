/**
 * FuturAIse Agent System - Main Export
 *
 * All 32 agents organized and ready to use throughout the application
 */

// Governance Agents (Tier 1)
export { CEOAgent, ceoAgent } from './governance/ceo-agent'
export { GroundingAgent, groundingAgent } from './governance/grounding-agent'
export { EthicsAgent, ethicsAgent } from './governance/ethics-agent'

// All other agents
export { agents } from './all-agents-implementation'

// Types
export * from './types'

// Claude Service
export * from './claude-service'

// ============================================================================
// QUICK ACCESS - Most Used Agents
// ============================================================================

import { agents } from './all-agents-implementation'
import { ceoAgent } from './governance/ceo-agent'
import { groundingAgent } from './governance/grounding-agent'
import { ethicsAgent } from './governance/ethics-agent'

// Core agents for MVP
export const coreAgents = {
  // AI conversation & guidance
  aiGuide: agents.ops.aiGuide,
  problemSolution: agents.soul.problemSolution,
  ultimateFulfillment: agents.soul.ultimateFulfillment,

  // Student tracking
  studentEmotional: agents.student.emotional,
  studentBehavioral: agents.student.behavioral,
  studentPsychological: agents.student.psychological,

  // Operations
  orchestrator: agents.ops.orchestrator,
  communication: agents.ops.communication,
  intervention: agents.ops.intervention,

  // Governance
  ceo: ceoAgent,
  grounding: groundingAgent,
  ethics: ethicsAgent
}

// Agent registry for dynamic access
export const agentRegistry = {
  // TIER 1: Governance
  'ceo': ceoAgent,
  'grounding': groundingAgent,
  'ethics': ethicsAgent,

  // TIER 2: Internal Health
  'internal-emotional': agents.internal.emotional,
  'internal-psychological': agents.internal.psychological,
  'internal-behavioral': agents.internal.behavioral,

  // TIER 3: Student Tracking
  'student-emotional': agents.student.emotional,
  'student-psychological': agents.student.psychological,
  'student-behavioral': agents.student.behavioral,

  // TIER 4: Product Soul
  'problem-solution': agents.soul.problemSolution,
  'ultimate-fulfillment': agents.soul.ultimateFulfillment,

  // TIER 5: Desire Engine
  'social-proof': agents.desire.socialProof,
  'status': agents.desire.status,
  'competitive-edge': agents.desire.competitiveEdge,
  'monetization': agents.desire.monetization,
  'identity': agents.desire.identity,
  'curiosity': agents.desire.curiosity,

  // TIER 6: Content
  'content': agents.content,

  // TIER 7: Analytics
  'value-analyzer': agents.analytics.valueAnalyzer,
  'value-generator': agents.analytics.valueGenerator,
  'data-analytics': agents.analytics.data,

  // TIER 8: Funnel
  'funnel': agents.funnel,

  // TIER 9: Stakeholders
  'parent-engagement': agents.stakeholders.parent,
  'teacher': agents.stakeholders.teacher,
  'gtm': agents.stakeholders.gtm,

  // TIER 10: Ecosystem Ops
  'orchestrator': agents.ops.orchestrator,
  'ai-guide': agents.ops.aiGuide,
  'communication': agents.ops.communication,
  'intervention': agents.ops.intervention,
  'upgrade-intelligence': agents.ops.upgrade
}

// Helper function to get any agent by name
export function getAgent(agentName: string) {
  return agentRegistry[agentName as keyof typeof agentRegistry]
}

// Helper to check if all critical agents are available
export function validateAgentSystem(): { valid: boolean; missing: string[] } {
  const criticalAgents = [
    'ai-guide',
    'problem-solution',
    'student-emotional',
    'student-behavioral',
    'orchestrator',
    'communication',
    'ethics'
  ]

  const missing = criticalAgents.filter(name => !agentRegistry[name as keyof typeof agentRegistry])

  return {
    valid: missing.length === 0,
    missing
  }
}
